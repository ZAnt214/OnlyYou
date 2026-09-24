-- Produtos e serviços eram protegidos por RLS de "dono", mas o papel
-- authenticated ainda tinha DML direto. Isso permitia contornar validações
-- das RPCs e, no caso de produtos, alterar contadores como rating/sales_count.
-- A partir daqui, o cliente só escreve pelo conjunto de RPCs auditadas.

revoke insert, update, delete on table public.products from authenticated;
revoke insert, update, delete on table public.gigs from authenticated;

create or replace function public.guard_product_catalog_write()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Operações internas/service role (webhook de pagamento, jobs administrativos)
  -- não carregam auth.uid e continuam podendo atualizar contadores reais.
  if v_user_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if public.is_admin() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and 'creator' = any(roles)
  ) then
    raise exception 'Apenas criadores podem alterar produtos.';
  end if;

  if tg_op = 'INSERT' then
    if new.creator_id <> v_user_id then
      raise exception 'Criador inválido.';
    end if;
    if new.rating <> 0 or new.rating_count <> 0 or new.sales_count <> 0 then
      raise exception 'Métricas do produto não podem ser definidas manualmente.';
    end if;
    return new;
  end if;

  if old.creator_id <> v_user_id then
    raise exception 'Produto não pertence a este criador.';
  end if;

  if tg_op = 'UPDATE' then
    if new.creator_id <> old.creator_id then
      raise exception 'Não é possível transferir o produto.';
    end if;
    if new.rating is distinct from old.rating
       or new.rating_count is distinct from old.rating_count
       or new.sales_count is distinct from old.sales_count
       or new.created_at is distinct from old.created_at then
      raise exception 'Métricas do produto são controladas pelo Jobê.';
    end if;
    return new;
  end if;

  return old;
end;
$$;

drop trigger if exists guard_product_catalog_write_trigger on public.products;
create trigger guard_product_catalog_write_trigger
before insert or update or delete on public.products
for each row execute function public.guard_product_catalog_write();

create or replace function public.guard_gig_catalog_write()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if public.is_admin() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and 'creator' = any(roles)
  ) then
    raise exception 'Apenas criadores podem alterar serviços.';
  end if;

  if tg_op = 'INSERT' then
    if new.creator_id <> v_user_id then
      raise exception 'Criador inválido.';
    end if;
    return new;
  end if;

  if old.creator_id <> v_user_id then
    raise exception 'Serviço não pertence a este criador.';
  end if;

  if tg_op = 'UPDATE' then
    if new.creator_id <> old.creator_id then
      raise exception 'Não é possível transferir o serviço.';
    end if;
    if new.position is distinct from old.position
       or new.created_at is distinct from old.created_at then
      raise exception 'Campos internos do serviço são controlados pelo Jobê.';
    end if;
    return new;
  end if;

  return old;
end;
$$;

drop trigger if exists guard_gig_catalog_write_trigger on public.gigs;
create trigger guard_gig_catalog_write_trigger
before insert or update or delete on public.gigs
for each row execute function public.guard_gig_catalog_write();

-- RPCs de catálogo passam a executar com privilégio do owner, mas mantêm
-- auth.uid() do usuário e continuam sujeitas aos guards acima.
alter function public.create_product(text,text,text,text[],text,integer,integer,text,text[],text,text) security definer;
alter function public.update_product(uuid,text,text,text,text[],text,integer,integer,text,text[],text,text) security definer;
alter function public.delete_product(uuid) security definer;

alter function public.create_gig(text,text,integer,integer,text,text,text,text,integer,text,text) security definer;
alter function public.create_gig(text,text,integer,integer,text,text,text,text,integer,text,text,integer,text[],text[]) security definer;
alter function public.update_gig(uuid,text,text,integer,integer,text,text,text,text,text,integer,text,text) security definer;
alter function public.update_gig(uuid,text,text,integer,integer,text,text,text,text,text,integer,text,text,integer,text[],text[]) security definer;
alter function public.delete_gig(uuid) security definer;

revoke all on function public.guard_product_catalog_write() from public, anon, authenticated;
revoke all on function public.guard_gig_catalog_write() from public, anon, authenticated;
