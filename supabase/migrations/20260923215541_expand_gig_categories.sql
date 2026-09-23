-- Expande as categorias de gig (serviço personalizado) de 3 pra 11 valores,
-- reaproveitando os slugs já usados pelos produtos (design, programacao,
-- marketing, videos, redacao-e-copywriting, ui-ux, consultorias) e
-- adicionando "assistente-virtual", categoria que não existia em lugar
-- nenhum da plataforma. elojob/play_together continuam com os mesmos
-- campos especiais (jogo, elo, duração de sessão).

alter table public.gigs drop constraint gigs_category_check;
alter table public.gigs add constraint gigs_category_check check (
  category = any (array[
    'general', 'design', 'programacao', 'marketing', 'videos',
    'redacao-e-copywriting', 'ui-ux', 'consultorias', 'assistente-virtual',
    'elojob', 'play_together'
  ])
);

create or replace function public.create_gig(
  p_title text, p_description text, p_price_cents integer, p_delivery_days integer,
  p_cover_image_url text, p_category text, p_game text, p_platform text,
  p_session_minutes integer, p_current_rank text, p_target_rank text,
  p_revision_count integer default null, p_included_items text[] default '{}',
  p_gallery_urls text[] default '{}'
)
returns gigs
language plpgsql
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_gig public.gigs;
  v_next_position integer;
  v_included_items text[];
  v_gallery_urls text[];
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;
  if trim(coalesce(p_title, '')) = '' then
    raise exception 'Descreva o serviço que você vai fazer.';
  end if;
  if p_price_cents is null or p_price_cents < 0 then
    raise exception 'Informe um preço válido.';
  end if;
  if p_category not in (
    'general', 'design', 'programacao', 'marketing', 'videos',
    'redacao-e-copywriting', 'ui-ux', 'consultorias', 'assistente-virtual',
    'elojob', 'play_together'
  ) then
    raise exception 'Categoria de serviço inválida.';
  end if;
  if p_category in ('elojob', 'play_together') and trim(coalesce(p_game, '')) = '' then
    raise exception 'Informe o jogo.';
  end if;
  if p_category = 'elojob' and (
    trim(coalesce(p_current_rank, '')) = '' or
    trim(coalesce(p_target_rank, '')) = '' or
    p_delivery_days is null or p_delivery_days < 1
  ) then
    raise exception 'Informe o elo atual, o elo desejado e o prazo.';
  end if;
  if p_category = 'play_together' and (p_session_minutes is null or p_session_minutes < 15) then
    raise exception 'A sessão deve ter pelo menos 15 minutos.';
  end if;
  if p_revision_count is not null and p_revision_count < 0 then
    raise exception 'Quantidade de revisões inválida.';
  end if;

  select coalesce(array_agg(left(trim(item), 140)), '{}'::text[])
    into v_included_items
    from unnest(coalesce(p_included_items, '{}'::text[])) as item
    where trim(item) <> ''
    limit 8;

  select coalesce(array_agg(left(trim(url), 2048)), '{}'::text[])
    into v_gallery_urls
    from unnest(coalesce(p_gallery_urls, '{}'::text[])) as url
    where trim(url) <> ''
    limit 8;

  select coalesce(max(position), -1) + 1 into v_next_position
    from public.gigs where creator_id = v_user_id;

  insert into public.gigs (
    creator_id, title, description, price_cents, delivery_days, cover_image_url, position,
    category, game, platform, session_minutes, current_rank, target_rank,
    revision_count, included_items, gallery_urls
  )
  values (
    v_user_id,
    trim(p_title),
    coalesce(trim(p_description), ''),
    p_price_cents,
    case when p_category = 'play_together' then null else p_delivery_days end,
    nullif(trim(coalesce(p_cover_image_url, '')), ''),
    v_next_position,
    p_category,
    case when p_category in ('elojob', 'play_together') then nullif(trim(coalesce(p_game, '')), '') else null end,
    case when p_category in ('elojob', 'play_together') then nullif(trim(coalesce(p_platform, '')), '') else null end,
    case when p_category = 'play_together' then p_session_minutes else null end,
    case when p_category = 'elojob' then nullif(trim(coalesce(p_current_rank, '')), '') else null end,
    case when p_category = 'elojob' then nullif(trim(coalesce(p_target_rank, '')), '') else null end,
    p_revision_count,
    v_included_items,
    v_gallery_urls
  )
  returning * into v_gig;

  return v_gig;
end;
$function$;

create or replace function public.update_gig(
  p_id uuid, p_title text, p_description text, p_price_cents integer, p_delivery_days integer,
  p_cover_image_url text, p_status text, p_category text, p_game text, p_platform text,
  p_session_minutes integer, p_current_rank text, p_target_rank text,
  p_revision_count integer default null, p_included_items text[] default '{}',
  p_gallery_urls text[] default '{}'
)
returns gigs
language plpgsql
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_gig public.gigs;
  v_included_items text[];
  v_gallery_urls text[];
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;
  if trim(coalesce(p_title, '')) = '' then
    raise exception 'Descreva o serviço que você vai fazer.';
  end if;
  if p_price_cents is null or p_price_cents < 0 then
    raise exception 'Informe um preço válido.';
  end if;
  if p_status not in ('active', 'paused') then
    raise exception 'Status inválido.';
  end if;
  if p_category not in (
    'general', 'design', 'programacao', 'marketing', 'videos',
    'redacao-e-copywriting', 'ui-ux', 'consultorias', 'assistente-virtual',
    'elojob', 'play_together'
  ) then
    raise exception 'Categoria de serviço inválida.';
  end if;
  if p_category in ('elojob', 'play_together') and trim(coalesce(p_game, '')) = '' then
    raise exception 'Informe o jogo.';
  end if;
  if p_category = 'elojob' and (
    trim(coalesce(p_current_rank, '')) = '' or
    trim(coalesce(p_target_rank, '')) = '' or
    p_delivery_days is null or p_delivery_days < 1
  ) then
    raise exception 'Informe o elo atual, o elo desejado e o prazo.';
  end if;
  if p_category = 'play_together' and (p_session_minutes is null or p_session_minutes < 15) then
    raise exception 'A sessão deve ter pelo menos 15 minutos.';
  end if;
  if p_revision_count is not null and p_revision_count < 0 then
    raise exception 'Quantidade de revisões inválida.';
  end if;

  select coalesce(array_agg(left(trim(item), 140)), '{}'::text[])
    into v_included_items
    from unnest(coalesce(p_included_items, '{}'::text[])) as item
    where trim(item) <> ''
    limit 8;

  select coalesce(array_agg(left(trim(url), 2048)), '{}'::text[])
    into v_gallery_urls
    from unnest(coalesce(p_gallery_urls, '{}'::text[])) as url
    where trim(url) <> ''
    limit 8;

  update public.gigs set
    title = trim(p_title),
    description = coalesce(trim(p_description), ''),
    price_cents = p_price_cents,
    delivery_days = case when p_category = 'play_together' then null else p_delivery_days end,
    cover_image_url = nullif(trim(coalesce(p_cover_image_url, '')), ''),
    status = p_status,
    category = p_category,
    game = case when p_category in ('elojob', 'play_together') then nullif(trim(coalesce(p_game, '')), '') else null end,
    platform = case when p_category in ('elojob', 'play_together') then nullif(trim(coalesce(p_platform, '')), '') else null end,
    session_minutes = case when p_category = 'play_together' then p_session_minutes else null end,
    current_rank = case when p_category = 'elojob' then nullif(trim(coalesce(p_current_rank, '')), '') else null end,
    target_rank = case when p_category = 'elojob' then nullif(trim(coalesce(p_target_rank, '')), '') else null end,
    revision_count = p_revision_count,
    included_items = v_included_items,
    gallery_urls = v_gallery_urls,
    updated_at = now()
  where id = p_id and creator_id = v_user_id
  returning * into v_gig;

  if not found then
    raise exception 'Anúncio não encontrado.';
  end if;

  return v_gig;
end;
$function$;
