create or replace function public.is_safe_https_media_url(value text)
returns boolean
language sql
immutable
set search_path to ''
as $$
  select
    value is null
    or btrim(value) = ''
    or (
      char_length(value) <= 2048
      and value ~ '^https://[^[:space:]]+$'
    );
$$;

create or replace function public.are_safe_https_media_urls(values text[])
returns boolean
language sql
immutable
set search_path to ''
as $$
  select coalesce(
    bool_and(public.is_safe_https_media_url(item)),
    true
  )
  from unnest(coalesce(values, '{}'::text[])) as item;
$$;

alter table public.products
  drop constraint if exists products_cover_image_https,
  add constraint products_cover_image_https
    check (public.is_safe_https_media_url(cover_image_url)) not valid;

alter table public.products
  drop constraint if exists products_preview_images_https,
  add constraint products_preview_images_https
    check (public.are_safe_https_media_urls(preview_images)) not valid;

alter table public.gigs
  drop constraint if exists gigs_cover_image_https,
  add constraint gigs_cover_image_https
    check (public.is_safe_https_media_url(cover_image_url)) not valid;

alter table public.gigs
  drop constraint if exists gigs_gallery_urls_https,
  add constraint gigs_gallery_urls_https
    check (public.are_safe_https_media_urls(gallery_urls)) not valid;

revoke all on function public.is_safe_https_media_url(text) from public, anon, authenticated;
revoke all on function public.are_safe_https_media_urls(text[]) from public, anon, authenticated;
