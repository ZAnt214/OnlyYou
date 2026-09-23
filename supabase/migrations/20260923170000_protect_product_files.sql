-- A URL do arquivo vendido não pertence ao catálogo público. RLS não oculta
-- colunas, então ela precisa morar em uma tabela cuja própria linha é privada.
create table if not exists public.product_files (
  product_id uuid primary key references public.products(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  file_url text not null check (length(btrim(file_url)) between 1 and 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_files enable row level security;

drop policy if exists "owner_or_buyer_reads_product_file" on public.product_files;
create policy "owner_or_buyer_reads_product_file"
on public.product_files for select
to authenticated
using (
  creator_id = (select auth.uid())
  or exists (
    select 1
    from public.product_entitlements entitlement
    where entitlement.product_id = product_files.product_id
      and entitlement.buyer_id = (select auth.uid())
      and entitlement.status = 'active'
  )
);

revoke all on public.product_files from public, anon, authenticated;
grant select on public.product_files to authenticated;

-- Migra os arquivos existentes antes de apagar os links da linha pública.
insert into public.product_files (product_id, creator_id, file_url)
select id, creator_id, btrim(file_url)
from public.products
where file_url is not null and btrim(file_url) <> ''
on conflict (product_id) do update
set file_url = excluded.file_url, updated_at = now();

-- O gatilho captura o arquivo após toda criação/edição. SECURITY DEFINER é
-- interno: ninguém pode executá-lo via API.
create or replace function public.protect_product_file_url()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.file_url is not null and btrim(new.file_url) <> '' then
    insert into public.product_files (product_id, creator_id, file_url)
    values (new.id, new.creator_id, btrim(new.file_url))
    on conflict (product_id) do update
    set creator_id = excluded.creator_id,
        file_url = excluded.file_url,
        updated_at = now();
  end if;

  -- A segunda atualização dispara o gatilho novamente, mas a condição WHEN
  -- ignora NULL e encerra a recursão imediatamente.
  update public.products set file_url = null where id = new.id;
  return new;
end;
$$;

revoke all on function public.protect_product_file_url() from public, anon, authenticated;

drop trigger if exists protect_product_file_url on public.products;
create trigger protect_product_file_url
after insert or update of file_url on public.products
for each row
when (new.file_url is not null)
execute function public.protect_product_file_url();

-- SELECT de tabela inteira voltaria a expor qualquer coluna sensível criada
-- no futuro. O catálogo recebe apenas uma lista explícita de colunas.
revoke select on public.products from public, anon, authenticated;
grant select (
  id, creator_id, title, description, category, tags, type, price_cents,
  promo_price_cents, cover_image_url, preview_images, status, rating,
  rating_count, sales_count, created_at, updated_at
) on public.products to anon, authenticated;
