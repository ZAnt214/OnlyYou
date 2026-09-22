-- As RPCs de edição só tocam colunas editáveis pelo próprio dono. Mantê-las
-- como SECURITY INVOKER faz o Postgres aplicar também os grants e a RLS.
grant update (
  display_name,
  bio,
  offerings,
  offerings_description,
  skills,
  languages,
  updated_at
) on table public.profiles to authenticated;

alter function public.update_my_creator_profile(text, text, text[], text) security invoker;
alter function public.update_creator_skills(text[]) security invoker;
alter function public.update_creator_languages(text[]) security invoker;
