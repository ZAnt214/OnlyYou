create or replace function public.request_withdrawal(
  p_amount_cents integer,
  p_pix_key_type text,
  p_pix_key text
)
returns public.withdrawals
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_creator_id uuid := auth.uid();
  v_account public.creator_payout_accounts;
  v_earned_cents bigint;
  v_eligible_cents bigint;
  v_pending_release_cents bigint;
  v_reserved_cents bigint;
  v_available_cents bigint;
  v_row public.withdrawals;
begin
  if v_creator_id is null then
    raise exception 'Não autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_creator_id
      and 'creator' = any(roles)
  ) then
    raise exception 'Apenas criadores podem solicitar saque.';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Valor inválido.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_creator_id::text));

  select *
    into v_account
  from public.creator_payout_accounts
  where creator_id = v_creator_id
  for update;

  if v_account.creator_id is null then
    raise exception 'Cadastre sua chave Pix de recebimento antes de solicitar um saque.';
  end if;

  if v_account.eligible_after > now() then
    raise exception 'Sua chave Pix foi alterada recentemente. Aguarde o período de segurança antes de solicitar um novo saque.';
  end if;

  if v_account.pix_key_type <> p_pix_key_type
     or v_account.pix_key <> btrim(p_pix_key) then
    raise exception 'O saque deve usar a chave Pix cadastrada na sua conta de recebimento.';
  end if;

  if exists (
    select 1
    from public.withdrawals
    where creator_id = v_creator_id
      and status = 'requested'
  ) then
    raise exception 'Você já tem um saque em análise.';
  end if;

  select
    coalesce(sum(pc.creator_amount_cents) filter (where pc.status = 'paid'), 0)::bigint,
    coalesce(sum(pc.creator_amount_cents) filter (
      where pc.status = 'paid'
        and (
          pc.kind = 'product'
          or (
            pc.kind = 'custom_service'
            and exists (
              select 1
              from public.custom_service_orders cso
              where cso.order_id = pc.order_id
                and cso.creator_id = v_creator_id
                and cso.status = 'completed'
            )
          )
        )
    ), 0)::bigint
  into v_earned_cents, v_eligible_cents
  from public.payment_confirmations pc
  where pc.creator_id = v_creator_id;

  v_pending_release_cents := greatest(0, v_earned_cents - v_eligible_cents);

  select coalesce(sum(amount_cents), 0)::bigint
    into v_reserved_cents
  from public.withdrawals
  where creator_id = v_creator_id
    and status in ('requested','paid');

  v_available_cents := greatest(0, v_eligible_cents - v_reserved_cents);

  if p_amount_cents > v_available_cents then
    raise exception 'Valor solicitado maior que o saldo disponível para saque.';
  end if;

  insert into public.withdrawals (
    creator_id, amount_cents, pix_key_type, pix_key,
    earned_cents_at_request, eligible_cents_at_request,
    pending_release_cents_at_request, reserved_cents_before_request,
    available_cents_before_request
  )
  values (
    v_creator_id, p_amount_cents, v_account.pix_key_type, v_account.pix_key,
    v_earned_cents, v_eligible_cents, v_pending_release_cents,
    v_reserved_cents, v_available_cents
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.request_withdrawal(integer,text,text) from public, anon;
grant execute on function public.request_withdrawal(integer,text,text) to authenticated;

create or replace function public.review_withdrawal(
  p_withdrawal_id uuid,
  p_status text,
  p_admin_notes text default null
)
returns public.withdrawals
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_row public.withdrawals;
  v_account public.creator_payout_accounts;
  v_eligible_cents bigint;
  v_reserved_cents bigint;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'Apenas administradores podem revisar saques.';
  end if;

  if p_status not in ('paid','rejected') then
    raise exception 'Status inválido.';
  end if;

  select *
    into v_row
  from public.withdrawals
  where id = p_withdrawal_id
  for update;

  if v_row.id is null then
    raise exception 'Saque não encontrado.';
  end if;

  if v_row.status <> 'requested' then
    raise exception 'Este saque já foi revisado.';
  end if;

  if p_status = 'paid' then
    select *
      into v_account
    from public.creator_payout_accounts
    where creator_id = v_row.creator_id;

    if v_account.creator_id is null then
      raise exception 'O criador não possui conta Pix de recebimento cadastrada.';
    end if;

    if v_account.pix_key_type <> v_row.pix_key_type
       or v_account.pix_key <> v_row.pix_key then
      raise exception 'A chave Pix atual não corresponde à chave registrada neste saque. Revise antes de pagar.';
    end if;

    if v_account.eligible_after > now() then
      raise exception 'A chave Pix está em período de segurança. Aguarde antes de concluir o saque.';
    end if;

    select coalesce(sum(pc.creator_amount_cents) filter (
      where pc.status = 'paid'
        and (
          pc.kind = 'product'
          or (
            pc.kind = 'custom_service'
            and exists (
              select 1
              from public.custom_service_orders cso
              where cso.order_id = pc.order_id
                and cso.creator_id = v_row.creator_id
                and cso.status = 'completed'
            )
          )
        )
    ), 0)::bigint
    into v_eligible_cents
    from public.payment_confirmations pc
    where pc.creator_id = v_row.creator_id;

    select coalesce(sum(amount_cents), 0)::bigint
      into v_reserved_cents
    from public.withdrawals
    where creator_id = v_row.creator_id
      and status in ('requested','paid');

    if v_eligible_cents < v_reserved_cents then
      raise exception 'O saldo elegível caiu depois da solicitação. Revise pagamentos, estornos e disputas antes de pagar.';
    end if;
  end if;

  update public.withdrawals
  set
    status = p_status,
    reviewed_at = now(),
    reviewed_by = v_admin_id,
    admin_notes = coalesce(nullif(btrim(coalesce(p_admin_notes, '')), ''), admin_notes)
  where id = p_withdrawal_id
    and status = 'requested'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Este saque já foi revisado.';
  end if;

  insert into public.notifications (user_id, type, title, body, link_href)
  values (
    v_row.creator_id,
    case when p_status = 'paid' then 'WITHDRAWAL_PAID' else 'WITHDRAWAL_REJECTED' end,
    case when p_status = 'paid' then 'Saque concluído' else 'Saque recusado' end,
    case when p_status = 'paid'
      then 'Seu saque foi transferido e concluído.'
      else 'Seu saque foi recusado. Confira os detalhes no painel.'
    end,
    '/dashboard/carteira'
  );

  return v_row;
end;
$$;

revoke all on function public.review_withdrawal(uuid,text,text) from public, anon;
grant execute on function public.review_withdrawal(uuid,text,text) to authenticated;
