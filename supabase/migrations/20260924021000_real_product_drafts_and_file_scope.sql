-- Rascunhos reais: arquivo/preço só são obrigatórios na publicação.
-- Arquivos novos de produto precisam vir do namespace do próprio criador no Vercel Blob.

create or replace function public.create_product(
  p_title text,
  p_description text,
  p_category text,
  p_tags text[],
  p_type text,
  p_price_cents integer,
  p_promo_price_cents integer,
  p_cover_image_url text,
  p_preview_images text[],
  p_file_url text,
  p_status text
)
returns public.products
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_product public.products;
  v_tags text[];
  v_preview_images text[];
  v_file_url text := nullif(btrim(coalesce(p_file_url, '')), '');
begin
  if v_user_id is null then raise exception 'É necessário estar autenticado.'; end if;
  if char_length(btrim(coalesce(p_title, ''))) < 4 then raise exception 'Dê um nome ao produto.'; end if;
  if char_length(btrim(coalesce(p_title, ''))) > 140 then raise exception 'Nome do produto muito longo.'; end if;
  if char_length(coalesce(p_description, '')) > 3000 then raise exception 'Descrição muito longa.'; end if;
  if btrim(coalesce(p_category, '')) = '' then raise exception 'Informe a categoria.'; end if;
  if p_status not in ('draft', 'approved') then raise exception 'Status inválido.'; end if;
  if p_price_cents is null or p_price_cents < 0 then raise exception 'Informe um preço válido.'; end if;
  if p_promo_price_cents is not null and p_promo_price_cents < 0 then raise exception 'Preço promocional inválido.'; end if;
  if p_promo_price_cents is not null and p_price_cents > 0 and p_promo_price_cents >= p_price_cents then
    raise exception 'O preço promocional precisa ser menor que o preço normal.';
  end if;

  if p_status = 'approved' then
    if char_length(btrim(coalesce(p_description, ''))) < 20 then
      raise exception 'Conte um pouco mais sobre o produto antes de publicar.';
    end if;
    if p_price_cents <= 0 then raise exception 'Informe um preço maior que zero.'; end if;
    if v_file_url is null then raise exception 'Envie o arquivo do produto antes de publicar.'; end if;
  end if;

  if v_file_url is not null and (
    v_file_url !~ '^https://[A-Za-z0-9.-]+\.blob\.vercel-storage\.com/creator-files/[0-9a-f-]+/products/[A-Za-z0-9._~%/-]+$'
    or position('/creator-files/' || v_user_id::text || '/products/' in v_file_url) = 0
  ) then
    raise exception 'O arquivo precisa ter sido enviado pelo fluxo seguro do produto.';
  end if;

  select coalesce(array_agg(left(btrim(tag), 40)), '{}'::text[])
    into v_tags
    from (
      select tag from unnest(coalesce(p_tags, '{}'::text[])) as tag
      where btrim(tag) <> ''
      limit 8
    ) q;

  select coalesce(array_agg(left(btrim(url), 2048)), '{}'::text[])
    into v_preview_images
    from (
      select url from unnest(coalesce(p_preview_images, '{}'::text[])) as url
      where btrim(url) <> ''
      limit 8
    ) q;

  insert into public.products (
    creator_id, title, description, category, tags, type, price_cents, promo_price_cents,
    cover_image_url, preview_images, file_url, status
  ) values (
    v_user_id, btrim(p_title), coalesce(btrim(p_description), ''), btrim(p_category), v_tags, p_type,
    p_price_cents, p_promo_price_cents, coalesce(btrim(p_cover_image_url), ''), v_preview_images,
    null, p_status
  )
  returning * into v_product;

  if v_file_url is not null then
    insert into public.product_files (product_id, creator_id, file_url)
    values (v_product.id, v_user_id, v_file_url)
    on conflict (product_id) do update
    set creator_id = excluded.creator_id,
        file_url = excluded.file_url,
        updated_at = now();
  end if;

  return v_product;
end;
$$;

create or replace function public.update_product(
  p_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_tags text[],
  p_type text,
  p_price_cents integer,
  p_promo_price_cents integer,
  p_cover_image_url text,
  p_preview_images text[],
  p_file_url text,
  p_status text
)
returns public.products
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_product public.products;
  v_tags text[];
  v_preview_images text[];
  v_file_url text := nullif(btrim(coalesce(p_file_url, '')), '');
  v_existing_file_url text;
begin
  if v_user_id is null then raise exception 'É necessário estar autenticado.'; end if;

  select pf.file_url
    into v_existing_file_url
  from public.products p
  left join public.product_files pf on pf.product_id = p.id
  where p.id = p_id and p.creator_id = v_user_id;

  if not found then raise exception 'Produto não encontrado.'; end if;
  if char_length(btrim(coalesce(p_title, ''))) < 4 then raise exception 'Dê um nome ao produto.'; end if;
  if char_length(btrim(coalesce(p_title, ''))) > 140 then raise exception 'Nome do produto muito longo.'; end if;
  if char_length(coalesce(p_description, '')) > 3000 then raise exception 'Descrição muito longa.'; end if;
  if btrim(coalesce(p_category, '')) = '' then raise exception 'Informe a categoria.'; end if;
  if p_status not in ('draft', 'approved') then raise exception 'Status inválido.'; end if;
  if p_price_cents is null or p_price_cents < 0 then raise exception 'Informe um preço válido.'; end if;
  if p_promo_price_cents is not null and p_promo_price_cents < 0 then raise exception 'Preço promocional inválido.'; end if;
  if p_promo_price_cents is not null and p_price_cents > 0 and p_promo_price_cents >= p_price_cents then
    raise exception 'O preço promocional precisa ser menor que o preço normal.';
  end if;

  if p_status = 'approved' then
    if char_length(btrim(coalesce(p_description, ''))) < 20 then
      raise exception 'Conte um pouco mais sobre o produto antes de publicar.';
    end if;
    if p_price_cents <= 0 then raise exception 'Informe um preço maior que zero.'; end if;
    if v_file_url is null then raise exception 'Envie o arquivo do produto antes de publicar.'; end if;
  end if;

  -- Arquivo legado já ligado a este produto pode continuar. Qualquer arquivo novo
  -- precisa pertencer ao namespace do próprio criador.
  if v_file_url is not null
     and v_file_url is distinct from v_existing_file_url
     and (
       v_file_url !~ '^https://[A-Za-z0-9.-]+\.blob\.vercel-storage\.com/creator-files/[0-9a-f-]+/products/[A-Za-z0-9._~%/-]+$'
       or position('/creator-files/' || v_user_id::text || '/products/' in v_file_url) = 0
     ) then
    raise exception 'O arquivo precisa ter sido enviado pelo fluxo seguro do produto.';
  end if;

  select coalesce(array_agg(left(btrim(tag), 40)), '{}'::text[])
    into v_tags
    from (
      select tag from unnest(coalesce(p_tags, '{}'::text[])) as tag
      where btrim(tag) <> ''
      limit 8
    ) q;

  select coalesce(array_agg(left(btrim(url), 2048)), '{}'::text[])
    into v_preview_images
    from (
      select url from unnest(coalesce(p_preview_images, '{}'::text[])) as url
      where btrim(url) <> ''
      limit 8
    ) q;

  update public.products set
    title = btrim(p_title),
    description = coalesce(btrim(p_description), ''),
    category = btrim(p_category),
    tags = v_tags,
    type = p_type,
    price_cents = p_price_cents,
    promo_price_cents = p_promo_price_cents,
    cover_image_url = coalesce(btrim(p_cover_image_url), ''),
    preview_images = v_preview_images,
    file_url = null,
    status = p_status,
    updated_at = now()
  where id = p_id and creator_id = v_user_id
  returning * into v_product;

  if v_file_url is null then
    delete from public.product_files where product_id = p_id and creator_id = v_user_id;
  else
    insert into public.product_files (product_id, creator_id, file_url)
    values (p_id, v_user_id, v_file_url)
    on conflict (product_id) do update
    set creator_id = excluded.creator_id,
        file_url = excluded.file_url,
        updated_at = now();
  end if;

  return v_product;
end;
$$;

revoke all on function public.create_product(text,text,text,text[],text,integer,integer,text,text[],text,text) from public, anon;
grant execute on function public.create_product(text,text,text,text[],text,integer,integer,text,text[],text,text) to authenticated;

revoke all on function public.update_product(uuid,text,text,text,text[],text,integer,integer,text,text[],text,text) from public, anon;
grant execute on function public.update_product(uuid,text,text,text,text[],text,integer,integer,text,text[],text,text) to authenticated;
