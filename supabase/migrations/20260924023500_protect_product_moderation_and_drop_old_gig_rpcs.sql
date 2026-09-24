-- Criador não pode contornar moderação mudando um produto suspenso/removido
-- de volta para draft/approved pelas RPCs normais.
create or replace function public.protect_creator_product_moderation_state()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if auth.uid() = old.creator_id
     and old.status not in ('draft', 'approved')
     and (
       new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.category is distinct from old.category
       or new.tags is distinct from old.tags
       or new.type is distinct from old.type
       or new.price_cents is distinct from old.price_cents
       or new.promo_price_cents is distinct from old.promo_price_cents
       or new.cover_image_url is distinct from old.cover_image_url
       or new.preview_images is distinct from old.preview_images
       or new.status is distinct from old.status
     ) then
    raise exception 'Este produto está bloqueado para alteração pelo criador.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_creator_product_moderation_state on public.products;
create trigger protect_creator_product_moderation_state
before update on public.products
for each row
execute function public.protect_creator_product_moderation_state();

-- Assinaturas antigas não são mais usadas pelo app e ampliavam a superfície
-- de RPC com validações desatualizadas.
drop function if exists public.create_gig(
  text,text,integer,integer,text,text,text,text,integer,text,text
);
drop function if exists public.update_gig(
  uuid,text,text,integer,integer,text,text,text,text,text,integer,text,text
);
