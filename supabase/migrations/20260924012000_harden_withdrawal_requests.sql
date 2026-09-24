-- Impede que o criador contorne as validações inserindo saques direto na tabela.
revoke insert on table public.withdrawals from authenticated;

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

  if p_pix_key_type not in ('cpf', 'email', 'phone', 'random') then
    raise exception 'Tipo de chave Pix inválido.';
  end if;

  if v_key = '' or char_length(v_key) > 254 then
    raise exception 'Chave Pix inválida.';
  end if;

  if p_pix_key_type = 'cpf' then
    v_digits := regexp_replace(v_key, '[^0-9]', '', 'g');
    if char_length(v_digits) <> 11 then
      raise exception 'CPF inválido.';
    end if;
    v_key := v_digits;
  elsif p_pix_key_type = 'email' then
    v_key := lower(v_key);
    if v_key !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'E-mail inválido.';
    end if;
  elsif p_pix_key_type = 'phone' then
    v_digits := regexp_replace(v_key, '[^0-9]', '', 'g');
    if char_length(v_digits) < 10 or char_length(v_digits) > 13 then
      raise exception 'Telefone inválido.';
    end if;
    v_key := v_digits;
  elsif p_pix_key_type = 'random' then
    v_key := lower(v_key);
    if v_key !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'Chave aleatória inválida.';
    end if;
  end if;

  -- Serializa duas solicitações concorrentes do mesmo criador. Sem isso,
  -- dois requests simultâneos poderiam ler o mesmo saldo antes de ambos inserirem.
  perform pg_advisory_xact_lock(hashtext(v_creator_id::text));

  select coalesce(sum(creator_amount_cents), 0)
    into v_earned_cents
  from public.payment_confirmations
  where creator_id = v_creator_id
    and status = 'paid';

  select coalesce(sum(amount_cents), 0)
    into v_reserved_cents
  from public.withdrawals
  where creator_id = v_creator_id
    and status in ('requested', 'paid');

  v_available_cents := greatest(0, v_earned_cents - v_reserved_cents);

  if p_amount_cents > v_available_cents then
    raise exception 'Valor solicitado maior que o saldo disponível.';
  end if;

  insert into public.withdrawals (creator_id, amount_cents, pix_key_type, pix_key)
  values (v_creator_id, p_amount_cents, p_pix_key_type, v_key)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.request_withdrawal(integer, text, text) from public, anon;
grant execute on function public.request_withdrawal(integer, text, text) to authenticated;
