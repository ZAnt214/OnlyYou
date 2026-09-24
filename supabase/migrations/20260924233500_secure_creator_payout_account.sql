create table if not exists public.creator_payout_accounts (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  pix_key_type text not null check (pix_key_type in ('cpf','email','phone','random')),
  pix_key text not null check (length(btrim(pix_key)) between 1 and 254),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  changed_at timestamptz not null default now(),
  eligible_after timestamptz not null default now(),
  change_count integer not null default 0 check (change_count >= 0)
);

create table if not exists public.creator_payout_account_history (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  old_pix_key_type text null,
  old_pix_key text null,
  new_pix_key_type text not null,
  new_pix_key text not null,
  event_type text not null check (event_type in ('created','changed','backfilled')),
  changed_at timestamptz not null default now()
);

create index if not exists creator_payout_history_creator_changed_idx
  on public.creator_payout_account_history (creator_id, changed_at desc);

alter table public.creator_payout_accounts enable row level security;
alter table public.creator_payout_account_history enable row level security;

revoke all on table public.creator_payout_accounts from public, anon, authenticated;
revoke all on table public.creator_payout_account_history from public, anon, authenticated;

insert into public.creator_payout_accounts (
  creator_id, pix_key_type, pix_key, created_at, updated_at, changed_at,
  eligible_after, change_count
)
select distinct on (w.creator_id)
  w.creator_id, w.pix_key_type, w.pix_key, w.requested_at, w.requested_at,
  w.requested_at, w.requested_at, 0
from public.withdrawals w
order by w.creator_id, w.requested_at desc
on conflict (creator_id) do nothing;

insert into public.creator_payout_account_history (
  creator_id, old_pix_key_type, old_pix_key, new_pix_key_type,
  new_pix_key, event_type, changed_at
)
select
  a.creator_id, null, null, a.pix_key_type, a.pix_key, 'backfilled', a.created_at
from public.creator_payout_accounts a
where not exists (
  select 1 from public.creator_payout_account_history h
  where h.creator_id = a.creator_id
);

create or replace function public.get_my_payout_account()
returns table(
  pix_key_type text,
  pix_key text,
  created_at timestamptz,
  updated_at timestamptz,
  changed_at timestamptz,
  eligible_after timestamptz,
  change_count integer,
  can_withdraw_now boolean
)
language plpgsql
security definer
set search_path to ''
as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'É necessário estar autenticado.'; end if;

  if not exists (
    select 1 from public.profiles
    where id = v_user_id and 'creator' = any(roles)
  ) then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  return query
  select
    a.pix_key_type, a.pix_key, a.created_at, a.updated_at, a.changed_at,
    a.eligible_after, a.change_count, a.eligible_after <= now()
  from public.creator_payout_accounts a
  where a.creator_id = v_user_id;
end;
$$;

revoke all on function public.get_my_payout_account() from public, anon;
grant execute on function public.get_my_payout_account() to authenticated;

create or replace function public.set_my_payout_account(
  p_pix_key_type text,
  p_pix_key text
)
returns table(
  pix_key_type text,
  pix_key text,
  created_at timestamptz,
  updated_at timestamptz,
  changed_at timestamptz,
  eligible_after timestamptz,
  change_count integer,
  can_withdraw_now boolean
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_key text := btrim(coalesce(p_pix_key, ''));
  v_digits text;
  v_existing public.creator_payout_accounts;
  v_changed boolean := false;
  v_now timestamptz := now();
begin
  if v_user_id is null then raise exception 'É necessário estar autenticado.'; end if;

  if not exists (
    select 1 from public.profiles
    where id = v_user_id and 'creator' = any(roles)
  ) then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  if p_pix_key_type not in ('cpf','email','phone','random') then
    raise exception 'Tipo de chave Pix inválido.';
  end if;

  if v_key = '' or char_length(v_key) > 254 then
    raise exception 'Chave Pix inválida.';
  end if;

  if p_pix_key_type = 'cpf' then
    v_digits := regexp_replace(v_key, '[^0-9]', '', 'g');
    if char_length(v_digits) <> 11 then raise exception 'CPF inválido.'; end if;
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

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  if exists (
    select 1 from public.withdrawals
    where creator_id = v_user_id and status = 'requested'
  ) then
    raise exception 'Não é possível alterar a chave Pix enquanto existe um saque em análise.';
  end if;

  select * into v_existing
  from public.creator_payout_accounts
  where creator_id = v_user_id
  for update;

  if v_existing.creator_id is null then
    insert into public.creator_payout_accounts (
      creator_id, pix_key_type, pix_key, created_at, updated_at,
      changed_at, eligible_after, change_count
    )
    values (
      v_user_id, p_pix_key_type, v_key, v_now, v_now, v_now, v_now, 0
    );

    insert into public.creator_payout_account_history (
      creator_id, old_pix_key_type, old_pix_key, new_pix_key_type,
      new_pix_key, event_type, changed_at
    )
    values (
      v_user_id, null, null, p_pix_key_type, v_key, 'created', v_now
    );
  else
    v_changed :=
      v_existing.pix_key_type <> p_pix_key_type or v_existing.pix_key <> v_key;

    if v_changed then
      update public.creator_payout_accounts
      set
        pix_key_type = p_pix_key_type,
        pix_key = v_key,
        updated_at = v_now,
        changed_at = v_now,
        eligible_after = v_now + interval '24 hours',
        change_count = change_count + 1
      where creator_id = v_user_id;

      insert into public.creator_payout_account_history (
        creator_id, old_pix_key_type, old_pix_key, new_pix_key_type,
        new_pix_key, event_type, changed_at
      )
      values (
        v_user_id, v_existing.pix_key_type, v_existing.pix_key,
        p_pix_key_type, v_key, 'changed', v_now
      );

      insert into public.notifications (user_id, type, title, body, link_href)
      values (
        v_user_id,
        'PAYOUT_ACCOUNT_CHANGED',
        'Chave Pix alterada',
        'Sua chave de recebimento foi alterada. Novos saques ficam bloqueados por 24 horas por segurança.',
        '/dashboard/carteira'
      );
    end if;
  end if;

  return query
  select
    a.pix_key_type, a.pix_key, a.created_at, a.updated_at, a.changed_at,
    a.eligible_after, a.change_count, a.eligible_after <= now()
  from public.creator_payout_accounts a
  where a.creator_id = v_user_id;
end;
$$;

revoke all on function public.set_my_payout_account(text,text) from public, anon;
grant execute on function public.set_my_payout_account(text,text) to authenticated;

create or replace function public.request_withdrawal_v2(p_amount_cents integer)
returns public.withdrawals
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_creator_id uuid := auth.uid();
  v_account public.creator_payout_accounts;
begin
  if v_creator_id is null then raise exception 'Não autenticado.'; end if;

  select * into v_account
  from public.creator_payout_accounts
  where creator_id = v_creator_id;

  if v_account.creator_id is null then
    raise exception 'Cadastre sua chave Pix de recebimento antes de solicitar um saque.';
  end if;

  return public.request_withdrawal(
    p_amount_cents,
    v_account.pix_key_type,
    v_account.pix_key
  );
end;
$$;

revoke all on function public.request_withdrawal_v2(integer) from public, anon;
grant execute on function public.request_withdrawal_v2(integer) to authenticated;

create or replace function public.get_admin_withdrawal_payout_account(p_withdrawal_id uuid)
returns table(
  creator_id uuid,
  current_pix_key_type text,
  current_pix_key text,
  payout_created_at timestamptz,
  payout_updated_at timestamptz,
  payout_changed_at timestamptz,
  payout_eligible_after timestamptz,
  payout_change_count integer,
  payout_matches_withdrawal boolean,
  payout_in_cooldown boolean,
  history jsonb
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_w public.withdrawals;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'Acesso administrativo necessário.';
  end if;

  select * into v_w
  from public.withdrawals
  where id = p_withdrawal_id;

  if v_w.id is null then raise exception 'Saque não encontrado.'; end if;

  return query
  select
    a.creator_id, a.pix_key_type, a.pix_key, a.created_at, a.updated_at,
    a.changed_at, a.eligible_after, a.change_count,
    a.pix_key_type = v_w.pix_key_type and a.pix_key = v_w.pix_key,
    a.eligible_after > now(),
    coalesce((
      select jsonb_agg(to_jsonb(h) order by h.changed_at desc)
      from (
        select
          ph.event_type, ph.old_pix_key_type, ph.old_pix_key,
          ph.new_pix_key_type, ph.new_pix_key, ph.changed_at
        from public.creator_payout_account_history ph
        where ph.creator_id = v_w.creator_id
        order by ph.changed_at desc
        limit 10
      ) h
    ), '[]'::jsonb)
  from public.creator_payout_accounts a
  where a.creator_id = v_w.creator_id;
end;
$$;

revoke all on function public.get_admin_withdrawal_payout_account(uuid) from public, anon;
grant execute on function public.get_admin_withdrawal_payout_account(uuid) to authenticated;
