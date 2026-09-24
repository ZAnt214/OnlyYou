-- Permite que o próprio criador troque ou remova sua foto de perfil.
grant update (avatar_url, updated_at) on table public.profiles to authenticated;

create or replace function public.update_creator_avatar(p_avatar_url text)
returns public.profiles
language plpgsql
security invoker
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_avatar_url text := nullif(btrim(coalesce(p_avatar_url, '')), '');
  v_row public.profiles;
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if v_avatar_url is not null then
    if char_length(v_avatar_url) > 2048 then
      raise exception 'O endereço da imagem é muito longo.';
    end if;
    if v_avatar_url !~ '^https://[A-Za-z0-9._~:/?#\[\]@!$&''()*+,;=%-]+$' then
      raise exception 'Endereço de imagem inválido.';
    end if;
  end if;

  update public.profiles
  set avatar_url = v_avatar_url,
      updated_at = now()
  where id = v_user_id
    and 'creator' = any(roles)
  returning * into v_row;

  if not found then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  return v_row;
end;
$$;

revoke all on function public.update_creator_avatar(text) from public, anon;
grant execute on function public.update_creator_avatar(text) to authenticated;
