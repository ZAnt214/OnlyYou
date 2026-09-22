-- Perfis são públicos para leitura, mas toda escrita de negócio passa por RPC.
-- Isso impede que uma conta altere diretamente roles, verificação, avaliações
-- e outros campos mantidos pelo sistema.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;

create or replace function public.become_creator()
returns public.profiles
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.profiles;
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  update public.profiles
  set roles = array(
        select distinct role_name
        from unnest(roles || array['creator']::text[]) as role_name
      ),
      updated_at = now()
  where id = v_user_id
  returning * into v_row;

  if not found then
    raise exception 'Perfil não encontrado.';
  end if;

  return v_row;
end;
$$;

create or replace function public.update_my_creator_profile(
  p_display_name text,
  p_bio text,
  p_offerings text[],
  p_offerings_description text
)
returns public.profiles
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_bio text := btrim(coalesce(p_bio, ''));
  v_offerings text[];
  v_description text := btrim(coalesce(p_offerings_description, ''));
  v_row public.profiles;
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = v_user_id and 'creator' = any(roles)
  ) then
    raise exception 'Apenas criadores podem editar este perfil.';
  end if;
  if char_length(v_display_name) not between 2 and 80 then
    raise exception 'O nome deve ter entre 2 e 80 caracteres.';
  end if;
  if char_length(v_bio) > 1000 then
    raise exception 'A bio pode ter no máximo 1000 caracteres.';
  end if;
  if char_length(v_description) > 1000 then
    raise exception 'A descrição pode ter no máximo 1000 caracteres.';
  end if;

  select coalesce(array_agg(value order by position), '{}'::text[])
  into v_offerings
  from (
    select min(ordinality) as position, btrim(item) as value
    from unnest(coalesce(p_offerings, '{}'::text[])) with ordinality as offered(item, ordinality)
    where btrim(item) <> '' and char_length(btrim(item)) <= 80
    group by btrim(item)
    order by min(ordinality)
    limit 20
  ) normalized;

  update public.profiles
  set display_name = v_display_name,
      bio = v_bio,
      offerings = v_offerings,
      offerings_description = v_description,
      updated_at = now()
  where id = v_user_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.update_creator_skills(p_skills text[])
returns public.profiles
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.profiles;
begin
  if v_user_id is null then raise exception 'É necessário estar autenticado.'; end if;
  update public.profiles
  set skills = coalesce(p_skills, '{}'), updated_at = now()
  where id = v_user_id and 'creator' = any(roles)
  returning * into v_row;
  if not found then raise exception 'Perfil de criador não encontrado.'; end if;
  return v_row;
end;
$$;

create or replace function public.update_creator_languages(p_languages text[])
returns public.profiles
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.profiles;
begin
  if v_user_id is null then raise exception 'É necessário estar autenticado.'; end if;
  update public.profiles
  set languages = coalesce(p_languages, '{}'), updated_at = now()
  where id = v_user_id and 'creator' = any(roles)
  returning * into v_row;
  if not found then raise exception 'Perfil de criador não encontrado.'; end if;
  return v_row;
end;
$$;

revoke all on function public.become_creator() from public, anon;
revoke all on function public.update_my_creator_profile(text, text, text[], text) from public, anon;
revoke all on function public.update_creator_skills(text[]) from public, anon;
revoke all on function public.update_creator_languages(text[]) from public, anon;

grant execute on function public.become_creator() to authenticated;
grant execute on function public.update_my_creator_profile(text, text, text[], text) to authenticated;
grant execute on function public.update_creator_skills(text[]) to authenticated;
grant execute on function public.update_creator_languages(text[]) to authenticated;
