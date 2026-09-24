-- Totais financeiros do painel devem ser calculados no banco sobre TODAS as linhas.
-- Isso evita que limites de paginação do cliente reduzam saldo/receita/gráficos em contas grandes.

create or replace function public.get_my_creator_balance()
returns table (
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
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and 'creator' = any(roles)
  ) then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  return query
  with earned as (
    select coalesce(sum(pc.creator_amount_cents), 0)::bigint as total
    from public.payment_confirmations pc
    where pc.creator_id = v_user_id
      and pc.status = 'paid'
  ),
  withdrawals_total as (
    select
      coalesce(sum(w.amount_cents) filter (where w.status in ('requested', 'paid')), 0)::bigint as reserved,
      coalesce(sum(w.amount_cents) filter (where w.status = 'paid'), 0)::bigint as withdrawn
    from public.withdrawals w
    where w.creator_id = v_user_id
  )
  select
    earned.total,
    withdrawals_total.reserved,
    withdrawals_total.withdrawn,
    greatest(0::bigint, earned.total - withdrawals_total.reserved)
  from earned
  cross join withdrawals_total;
end;
$$;

create or replace function public.get_my_creator_sales_summary()
returns table (
  total_sales bigint,
  gross_amount_cents bigint,
  creator_amount_cents bigint,
  product_sales bigint,
  product_creator_amount_cents bigint,
  service_sales bigint,
  service_creator_amount_cents bigint
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and 'creator' = any(roles)
  ) then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  return query
  select
    count(*)::bigint,
    coalesce(sum(pc.gross_amount_cents), 0)::bigint,
    coalesce(sum(pc.creator_amount_cents), 0)::bigint,
    count(*) filter (where pc.kind = 'product')::bigint,
    coalesce(sum(pc.creator_amount_cents) filter (where pc.kind = 'product'), 0)::bigint,
    count(*) filter (where pc.kind = 'custom_service')::bigint,
    coalesce(sum(pc.creator_amount_cents) filter (where pc.kind = 'custom_service'), 0)::bigint
  from public.payment_confirmations pc
  where pc.creator_id = v_user_id
    and pc.status = 'paid';
end;
$$;

create or replace function public.get_my_creator_monthly_sales(p_months integer default 12)
returns table (
  month_start date,
  creator_amount_cents bigint,
  gross_amount_cents bigint,
  sales_count bigint
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_months integer := greatest(1, least(coalesce(p_months, 12), 24));
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and 'creator' = any(roles)
  ) then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  return query
  select recent.month_start, recent.creator_amount_cents, recent.gross_amount_cents, recent.sales_count
  from (
    select
      date_trunc(
        'month',
        timezone('America/Sao_Paulo', coalesce(pc.confirmed_at, pc.created_at))
      )::date as month_start,
      coalesce(sum(pc.creator_amount_cents), 0)::bigint as creator_amount_cents,
      coalesce(sum(pc.gross_amount_cents), 0)::bigint as gross_amount_cents,
      count(*)::bigint as sales_count
    from public.payment_confirmations pc
    where pc.creator_id = v_user_id
      and pc.status = 'paid'
    group by 1
    order by 1 desc
    limit v_months
  ) recent
  order by recent.month_start asc;
end;
$$;

create or replace function public.list_my_creator_sales(
  p_kind text default null,
  p_query text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  order_id text,
  buyer_id uuid,
  gross_amount_cents integer,
  platform_fee_cents integer,
  creator_amount_cents integer,
  currency text,
  kind text,
  confirmed_at timestamptz,
  title text,
  buyer_name text,
  total_count bigint
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_kind text := nullif(btrim(coalesce(p_kind, '')), '');
  v_query text := lower(nullif(btrim(coalesce(p_query, '')), ''));
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 100));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and 'creator' = any(roles)
  ) then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  if v_kind is not null and v_kind not in ('product', 'custom_service') then
    raise exception 'Filtro de venda inválido.';
  end if;

  return query
  with base as (
    select
      pc.id,
      pc.order_id,
      coalesce(pc.buyer_id, po.buyer_id, cso.requester_id) as buyer_id,
      pc.gross_amount_cents,
      pc.platform_fee_cents,
      pc.creator_amount_cents,
      pc.currency,
      pc.kind,
      coalesce(pc.confirmed_at, pc.created_at) as confirmed_at,
      case
        when pc.kind = 'product' then coalesce(prod.title, 'Produto digital')
        when pc.kind = 'custom_service' then coalesce(cso.service_type, 'Serviço personalizado')
        else 'Venda'
      end as title,
      coalesce(bp.display_name, bp.username, 'Cliente') as buyer_name
    from public.payment_confirmations pc
    left join public.product_orders po
      on pc.kind = 'product'
     and pc.order_id = po.id::text
    left join public.products prod
      on prod.id = po.product_id
    left join public.custom_service_orders cso
      on pc.kind = 'custom_service'
     and pc.order_id = cso.order_id
    left join public.profiles bp
      on bp.id = coalesce(pc.buyer_id, po.buyer_id, cso.requester_id)
    where pc.creator_id = v_user_id
      and pc.status = 'paid'
  ),
  filtered as (
    select *
    from base
    where (v_kind is null or base.kind = v_kind)
      and (
        v_query is null
        or lower(base.title) like '%' || v_query || '%'
        or lower(base.buyer_name) like '%' || v_query || '%'
      )
  )
  select
    filtered.id,
    filtered.order_id,
    filtered.buyer_id,
    filtered.gross_amount_cents,
    filtered.platform_fee_cents,
    filtered.creator_amount_cents,
    filtered.currency,
    filtered.kind,
    filtered.confirmed_at,
    filtered.title,
    filtered.buyer_name,
    count(*) over()::bigint as total_count
  from filtered
  order by filtered.confirmed_at desc, filtered.id desc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.get_my_creator_balance() from public, anon;
grant execute on function public.get_my_creator_balance() to authenticated;

revoke all on function public.get_my_creator_sales_summary() from public, anon;
grant execute on function public.get_my_creator_sales_summary() to authenticated;

revoke all on function public.get_my_creator_monthly_sales(integer) from public, anon;
grant execute on function public.get_my_creator_monthly_sales(integer) to authenticated;

revoke all on function public.list_my_creator_sales(text,text,integer,integer) from public, anon;
grant execute on function public.list_my_creator_sales(text,text,integer,integer) to authenticated;
