-- Corrige ambiguidade entre a coluna de retorno "id" da função e profiles.id.
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
    from public.profiles p
    where p.id = v_user_id
      and 'creator' = any(p.roles)
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

revoke all on function public.list_my_creator_sales(text,text,integer,integer) from public, anon;
grant execute on function public.list_my_creator_sales(text,text,integer,integer) to authenticated;
