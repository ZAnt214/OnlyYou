-- Foto de perfil: a escrita direta na coluna deixa de ser permitida.
// Toda alteração passa pela RPC, que só aceita a URL gerada no namespace
// avatars/<auth.uid()>/ do Vercel Blob.
revoke update (avatar_url) on table public.profiles from authenticated;

create or replace function public.update_creator_avatar(p_avatar_url text)
returns public.profiles
language plpgsql
security definer
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

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and 'creator' = any(roles)
  ) then
    raise exception 'Perfil de criador não encontrado.';
  end if;

  if v_avatar_url is not null then
    if char_length(v_avatar_url) > 2048 then
      raise exception 'Endereço de imagem inválido.';
    end if;

    if v_avatar_url !~ '^https://[A-Za-z0-9.-]+\.blob\.vercel-storage\.com/avatars/[0-9a-f-]+/[A-Za-z0-9._~%/-]+$'
       or position('/avatars/' || v_user_id::text || '/' in v_avatar_url) = 0 then
      raise exception 'A foto precisa ter sido enviada pelo fluxo seguro do perfil.';
    end if;
  end if;

  update public.profiles
  set avatar_url = v_avatar_url,
      updated_at = now()
  where id = v_user_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.update_creator_avatar(text) from public, anon;
grant execute on function public.update_creator_avatar(text) to authenticated;
