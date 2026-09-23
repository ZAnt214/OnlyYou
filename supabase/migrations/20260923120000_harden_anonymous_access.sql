-- Anonymous visitors only need read access to public catalog data. RLS remains
-- active as the primary authorization layer; these revokes add least privilege.
revoke insert, update, delete, truncate, references, trigger
on all tables in schema public from anon;
revoke insert, update, delete, truncate, references, trigger
on all tables in schema public from public;

do $$
declare
  routine record;
begin
  for routine in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname <> 'is_admin'
      and p.proname <> 'handle_new_user'
  loop
    execute format('revoke execute on function %s from public', routine.signature);
    execute format('revoke execute on function %s from anon', routine.signature);
    execute format('grant execute on function %s to authenticated', routine.signature);
  end loop;
end;
$$;

-- The signup trigger runs internally, never as a public API routine.
alter function public.handle_new_user() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Ensure future tables and routines do not silently regain broad anonymous access.
alter default privileges in schema public
revoke insert, update, delete, truncate, references, trigger on tables from anon;
alter default privileges in schema public
revoke insert, update, delete, truncate, references, trigger on tables from public;

alter default privileges in schema public
revoke execute on functions from anon;
alter default privileges in schema public
revoke execute on functions from public;
