alter table public.withdrawals
  add column if not exists earned_cents_at_request bigint,
  add column if not exists eligible_cents_at_request bigint,
  add column if not exists pending_release_cents_at_request bigint,
  add column if not exists reserved_cents_before_request bigint,
  add column if not exists available_cents_before_request bigint;

create or replace function public.get_my_creator_balance()
returns table(
  earned_cents bigint,
  reserved_cents bigint,
  withdrawn_cents bigint,
  available_cents bigint
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'É necessário estar autenticado.'; end if;
  if not exists (
    select 1 from public.profiles
    where id = v_user_id and 'creator' = any(roles)
  ) then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  return query
  with earnings as (
    select
      coalesce(sum(pc.creator_amount_cents) filter (where pc.status = 'paid'), 0)::bigint as earned,
      coalesce(sum(pc.creator_amount_cents) filter (
        where pc.status = 'paid'
          and (
            pc.kind = 'product'
            or (
              pc.kind = 'custom_service'
              and exists (
                select 1 from public.custom_service_orders cso
                where cso.order_id = pc.order_id
                  and cso.creator_id = v_user_id
                  and cso.status = 'completed'
              )
            )
          )
      ), 0)::bigint as eligible
    from public.payment_confirmations pc
    where pc.creator_id = v_user_id
  ),
  withdrawals_total as (
    select
      coalesce(sum(w.amount_cents) filter (where w.status in ('requested', 'paid')), 0)::bigint as reserved,
      coalesce(sum(w.amount_cents) filter (where w.status = 'paid'), 0)::bigint as withdrawn
    from public.withdrawals w
    where w.creator_id = v_user_id
  )
  select
    earnings.earned,
    withdrawals_total.reserved,
    withdrawals_total.withdrawn,
    greatest(0::bigint, earnings.eligible - withdrawals_total.reserved)
  from earnings cross join withdrawals_total;
end;
$$;

create or replace function public.get_my_creator_payout_summary()
returns table(
  earned_cents bigint,
  eligible_cents bigint,
  pending_release_cents bigint,
  reserved_cents bigint,
  withdrawn_cents bigint,
  available_cents bigint
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'É necessário estar autenticado.'; end if;
  if not exists (
    select 1 from public.profiles
    where id = v_user_id and 'creator' = any(roles)
  ) then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  return query
  with earnings as (
    select
      coalesce(sum(pc.creator_amount_cents) filter (where pc.status = 'paid'), 0)::bigint as earned,
      coalesce(sum(pc.creator_amount_cents) filter (
        where pc.status = 'paid'
          and (
            pc.kind = 'product'
            or (
              pc.kind = 'custom_service'
              and exists (
                select 1 from public.custom_service_orders cso
                where cso.order_id = pc.order_id
                  and cso.creator_id = v_user_id
                  and cso.status = 'completed'
              )
            )
          )
      ), 0)::bigint as eligible
    from public.payment_confirmations pc
    where pc.creator_id = v_user_id
  ),
  withdrawals_total as (
    select
      coalesce(sum(w.amount_cents) filter (where w.status in ('requested', 'paid')), 0)::bigint as reserved,
      coalesce(sum(w.amount_cents) filter (where w.status = 'paid'), 0)::bigint as withdrawn
    from public.withdrawals w
    where w.creator_id = v_user_id
  )
  select
    earnings.earned,
    earnings.eligible,
    greatest(0::bigint, earnings.earned - earnings.eligible),
    withdrawals_total.reserved,
    withdrawals_total.withdrawn,
    greatest(0::bigint, earnings.eligible - withdrawals_total.reserved)
  from earnings cross join withdrawals_total;
end;
$$;

revoke all on function public.get_my_creator_payout_summary() from public, anon;
grant execute on function public.get_my_creator_payout_summary() to authenticated;

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
  v_key text := btrim(coalesce(p_pix_key, ''));
  v_digits text;
  v_earned_cents bigint;
  v_eligible_cents bigint;
  v_pending_release_cents bigint;
  v_reserved_cents bigint;
  v_available_cents bigint;
  v_row public.withdrawals;
begin
  if v_creator_id is null then raise exception 'Não autenticado.'; end if;
  if not exists (
    select 1 from public.profiles
    where id = v_creator_id and 'creator' = any(roles)
  ) then
    raise exception 'Apenas criadores podem solicitar saque.';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'Valor inválido.'; end if;
  if p_pix_key_type not in ('cpf', 'email', 'phone', 'random') then raise exception 'Tipo de chave Pix inválido.'; end if;
  if v_key = '' or char_length(v_key) > 254 then raise exception 'Chave Pix inválida.'; end if;

  if p_pix_key_type = 'cpf' then
    v_digits := regexp_replace(v_key, '[^0-9]', '', 'g');
    if char_length(v_digits) <> 11 then raise exception 'CPF inválido.'; end if;
    v_key := v_digits;
  elsif p_pix_key_type = 'email' then
    v_key := lower(v_key);
    if v_key !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'E-mail inválido.'; end if;
  elsif p_pix_key_type = 'phone' then
    v_digits := regexp_replace(v_key, '[^0-9]', '', 'g');
    if char_length(v_digits) < 10 or char_length(v_digits) > 13 then raise exception 'Telefone inválido.'; end if;
    v_key := v_digits;
  elsif p_pix_key_type = 'random' then
    v_key := lower(v_key);
    if v_key !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then raise exception 'Chave aleatória inválida.'; end if;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_creator_id::text));

  if exists (
    select 1 from public.withdrawals
    where creator_id = v_creator_id and status = 'requested'
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
              select 1 from public.custom_service_orders cso
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
    and status in ('requested', 'paid');

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
    v_creator_id, p_amount_cents, p_pix_key_type, v_key,
    v_earned_cents, v_eligible_cents, v_pending_release_cents,
    v_reserved_cents, v_available_cents
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.request_withdrawal(integer, text, text) from public, anon;
grant execute on function public.request_withdrawal(integer, text, text) to authenticated;

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
  v_eligible_cents bigint;
  v_reserved_cents bigint;
begin
  if v_admin_id is null or not public.is_admin() then raise exception 'Apenas administradores podem revisar saques.'; end if;
  if p_status not in ('paid', 'rejected') then raise exception 'Status inválido.'; end if;

  select * into v_row
  from public.withdrawals
  where id = p_withdrawal_id
  for update;

  if v_row.id is null then raise exception 'Saque não encontrado.'; end if;
  if v_row.status <> 'requested' then raise exception 'Este saque já foi revisado.'; end if;

  if p_status = 'paid' then
    select coalesce(sum(pc.creator_amount_cents) filter (
      where pc.status = 'paid'
        and (
          pc.kind = 'product'
          or (
            pc.kind = 'custom_service'
            and exists (
              select 1 from public.custom_service_orders cso
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
      and status in ('requested', 'paid');

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
  where id = p_withdrawal_id and status = 'requested'
  returning * into v_row;

  if v_row.id is null then raise exception 'Este saque já foi revisado.'; end if;

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

revoke all on function public.review_withdrawal(uuid, text, text) from public, anon;
grant execute on function public.review_withdrawal(uuid, text, text) to authenticated;

create or replace function public.get_admin_withdrawal_risk(p_withdrawal_id uuid)
returns table(
  withdrawal_id uuid,
  creator_id uuid,
  creator_username text,
  creator_display_name text,
  verification_status text,
  account_created_at timestamptz,
  withdrawal_amount_cents integer,
  withdrawal_status text,
  pix_key_type text,
  pix_key text,
  requested_at timestamptz,
  snapshot_earned_cents bigint,
  snapshot_eligible_cents bigint,
  snapshot_pending_release_cents bigint,
  snapshot_available_before_cents bigint,
  current_earned_cents bigint,
  current_eligible_cents bigint,
  current_pending_release_cents bigint,
  current_reserved_cents bigint,
  current_withdrawn_cents bigint,
  current_available_cents bigint,
  paid_sales_count bigint,
  product_sales_count bigint,
  service_sales_count bigint,
  unique_buyers_count bigint,
  completed_services_count bigint,
  open_service_orders_count bigint,
  open_disputes_count bigint,
  total_disputes_count bigint,
  problem_payments_count bigint,
  rejected_withdrawals_count bigint,
  paid_withdrawals_count bigint,
  self_purchase_count bigint,
  earnings_last_24h_cents bigint,
  earnings_last_7d_cents bigint,
  largest_buyer_share_percent numeric,
  pix_key_changed boolean,
  first_withdrawal boolean,
  payment_split_mismatch_count bigint,
  request_still_backed boolean,
  recent_sales jsonb,
  recent_withdrawals jsonb
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_w public.withdrawals;
begin
  if v_admin_id is null or not public.is_admin() then raise exception 'Acesso administrativo necessário.'; end if;

  select * into v_w from public.withdrawals where id = p_withdrawal_id;
  if v_w.id is null then raise exception 'Saque não encontrado.'; end if;

  return query
  with profile_data as (
    select p.id, p.username, p.display_name, p.verification_status, p.created_at
    from public.profiles p where p.id = v_w.creator_id
  ),
  earnings as (
    select
      coalesce(sum(pc.creator_amount_cents) filter (where pc.status = 'paid'), 0)::bigint as earned,
      coalesce(sum(pc.creator_amount_cents) filter (
        where pc.status = 'paid'
          and (
            pc.kind = 'product'
            or (
              pc.kind = 'custom_service'
              and exists (
                select 1 from public.custom_service_orders cso
                where cso.order_id = pc.order_id
                  and cso.creator_id = v_w.creator_id
                  and cso.status = 'completed'
              )
            )
          )
      ), 0)::bigint as eligible,
      count(*) filter (where pc.status = 'paid')::bigint as paid_sales,
      count(*) filter (where pc.status = 'paid' and pc.kind = 'product')::bigint as product_sales,
      count(*) filter (where pc.status = 'paid' and pc.kind = 'custom_service')::bigint as service_sales,
      count(distinct pc.buyer_id) filter (where pc.status = 'paid')::bigint as unique_buyers,
      count(*) filter (where pc.status in ('refunded', 'chargeback'))::bigint as problem_payments,
      count(*) filter (where pc.status = 'paid' and pc.buyer_id = pc.creator_id)::bigint as self_purchases,
      coalesce(sum(pc.creator_amount_cents) filter (
        where pc.status = 'paid'
          and coalesce(pc.confirmed_at, pc.created_at) >= now() - interval '24 hours'
      ), 0)::bigint as last_24h,
      coalesce(sum(pc.creator_amount_cents) filter (
        where pc.status = 'paid'
          and coalesce(pc.confirmed_at, pc.created_at) >= now() - interval '7 days'
      ), 0)::bigint as last_7d,
      count(*) filter (
        where pc.gross_amount_cents <> pc.platform_fee_cents + pc.creator_amount_cents
      )::bigint as split_mismatches
    from public.payment_confirmations pc
    where pc.creator_id = v_w.creator_id
  ),
  withdrawal_totals as (
    select
      coalesce(sum(w.amount_cents) filter (where w.status in ('requested', 'paid')), 0)::bigint as reserved,
      coalesce(sum(w.amount_cents) filter (where w.status = 'paid'), 0)::bigint as withdrawn,
      count(*) filter (where w.status = 'rejected')::bigint as rejected_count,
      count(*) filter (where w.status = 'paid')::bigint as paid_count,
      count(*) filter (where w.requested_at < v_w.requested_at)::bigint as previous_count
    from public.withdrawals w
    where w.creator_id = v_w.creator_id
  ),
  service_stats as (
    select
      count(*) filter (where cso.status = 'completed')::bigint as completed,
      count(*) filter (where cso.status in ('in_progress', 'delivered'))::bigint as open_orders
    from public.custom_service_orders cso
    where cso.creator_id = v_w.creator_id
  ),
  dispute_stats as (
    select
      count(*) filter (where d.status = 'open')::bigint as open_count,
      count(*)::bigint as total_count
    from public.disputes d
    join public.custom_service_orders cso on cso.id = d.custom_service_order_id
    where cso.creator_id = v_w.creator_id
  ),
  buyer_totals as (
    select pc.buyer_id, sum(pc.creator_amount_cents)::numeric as amount
    from public.payment_confirmations pc
    where pc.creator_id = v_w.creator_id and pc.status = 'paid'
    group by pc.buyer_id
  ),
  concentration as (
    select case
      when coalesce(sum(amount), 0) = 0 then 0::numeric
      else round((coalesce(max(amount), 0) / sum(amount)) * 100, 1)
    end as pct
    from buyer_totals
  ),
  previous_paid_key as (
    select w.pix_key_type, w.pix_key
    from public.withdrawals w
    where w.creator_id = v_w.creator_id
      and w.id <> v_w.id
      and w.status = 'paid'
      and w.requested_at < v_w.requested_at
    order by w.requested_at desc
    limit 1
  ),
  sales_json as (
    select coalesce(jsonb_agg(to_jsonb(s) order by s.confirmed_at desc), '[]'::jsonb) as data
    from (
      select
        pc.kind, pc.status, pc.gross_amount_cents, pc.creator_amount_cents,
        pc.method,
        coalesce(buyer.display_name, buyer.username, 'Comprador') as buyer_name,
        coalesce(pc.confirmed_at, pc.created_at) as confirmed_at,
        case when pc.kind = 'custom_service' then (
          select cso.status
          from public.custom_service_orders cso
          where cso.order_id = pc.order_id
          order by cso.created_at desc
          limit 1
        ) else null end as service_status
      from public.payment_confirmations pc
      left join public.profiles buyer on buyer.id = pc.buyer_id
      where pc.creator_id = v_w.creator_id
      order by coalesce(pc.confirmed_at, pc.created_at) desc
      limit 10
    ) s
  ),
  withdrawals_json as (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.requested_at desc), '[]'::jsonb) as data
    from (
      select w.id, w.amount_cents, w.pix_key_type, w.pix_key,
             w.status, w.requested_at, w.reviewed_at
      from public.withdrawals w
      where w.creator_id = v_w.creator_id
      order by w.requested_at desc
      limit 10
    ) x
  )
  select
    v_w.id, v_w.creator_id, pd.username, pd.display_name,
    pd.verification_status, pd.created_at,
    v_w.amount_cents, v_w.status, v_w.pix_key_type, v_w.pix_key, v_w.requested_at,
    v_w.earned_cents_at_request,
    v_w.eligible_cents_at_request,
    v_w.pending_release_cents_at_request,
    v_w.available_cents_before_request,
    e.earned, e.eligible, greatest(0::bigint, e.earned - e.eligible),
    wt.reserved, wt.withdrawn, greatest(0::bigint, e.eligible - wt.reserved),
    e.paid_sales, e.product_sales, e.service_sales, e.unique_buyers,
    ss.completed, ss.open_orders, ds.open_count, ds.total_count,
    e.problem_payments, wt.rejected_count, wt.paid_count, e.self_purchases,
    e.last_24h, e.last_7d, c.pct,
    case
      when ppk.pix_key is null then false
      else ppk.pix_key_type <> v_w.pix_key_type or ppk.pix_key <> v_w.pix_key
    end,
    wt.previous_count = 0,
    e.split_mismatches,
    e.eligible >= wt.reserved,
    sj.data, wj.data
  from profile_data pd
  cross join earnings e
  cross join withdrawal_totals wt
  cross join service_stats ss
  cross join dispute_stats ds
  cross join concentration c
  cross join sales_json sj
  cross join withdrawals_json wj
  left join previous_paid_key ppk on true;
end;
$$;

revoke all on function public.get_admin_withdrawal_risk(uuid) from public, anon;
grant execute on function public.get_admin_withdrawal_risk(uuid) to authenticated;
