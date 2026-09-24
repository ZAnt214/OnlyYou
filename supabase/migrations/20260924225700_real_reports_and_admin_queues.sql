create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('product','user','message','conversation')),
  target_id text not null check (length(btrim(target_id)) between 1 and 200),
  reason text not null check (reason in (
    'illegal_content','stolen_content','copyright_violation','fake_profile','fraud','other'
  )),
  description text not null check (length(btrim(description)) between 1 and 2000),
  evidence text null check (evidence is null or length(evidence) <= 2048),
  status text not null default 'open' check (status in ('open','under_review','resolved','dismissed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  custom_request_id uuid null references public.custom_requests(id) on delete set null,
  conversation_id uuid null references public.conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references public.profiles(id) on delete set null,
  decision text null check (decision is null or length(decision) <= 2000)
);

create index if not exists reports_status_priority_created_idx
  on public.reports (status, priority, created_at desc);
create index if not exists reports_conversation_idx
  on public.reports (conversation_id) where conversation_id is not null;
create index if not exists reports_custom_request_idx
  on public.reports (custom_request_id) where custom_request_id is not null;

alter table public.reports enable row level security;

revoke all on table public.reports from public, anon, authenticated;
grant select on table public.reports to authenticated;

drop policy if exists reports_admin_select on public.reports;
create policy reports_admin_select
on public.reports
for select
to authenticated
using (public.is_admin());

create or replace function public.create_report(
  p_target_type text,
  p_target_id text,
  p_reason text,
  p_description text,
  p_custom_request_id uuid default null,
  p_conversation_id uuid default null,
  p_evidence text default null
)
returns public.reports
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_priority text;
  v_report public.reports;
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if p_target_type not in ('product','user','message','conversation') then
    raise exception 'Tipo de denúncia inválido.';
  end if;

  if p_reason not in (
    'illegal_content','stolen_content','copyright_violation','fake_profile','fraud','other'
  ) then
    raise exception 'Motivo de denúncia inválido.';
  end if;

  if length(btrim(coalesce(p_target_id, ''))) < 1 then
    raise exception 'Alvo da denúncia inválido.';
  end if;

  if length(btrim(coalesce(p_description, ''))) < 1 then
    raise exception 'Descreva a denúncia.';
  end if;

  if p_custom_request_id is not null and not exists (
    select 1
    from public.custom_requests cr
    where cr.id = p_custom_request_id
      and (cr.requester_id = v_user_id or cr.creator_id = v_user_id)
  ) then
    raise exception 'Pedido não disponível para esta conta.';
  end if;

  if p_conversation_id is not null and not exists (
    select 1
    from public.conversations c
    join public.custom_requests cr on cr.id = c.custom_request_id
    where c.id = p_conversation_id
      and (cr.requester_id = v_user_id or cr.creator_id = v_user_id)
  ) then
    raise exception 'Conversa não disponível para esta conta.';
  end if;

  v_priority := case
    when p_reason = 'illegal_content' then 'urgent'
    when p_reason in ('stolen_content','fraud') then 'high'
    else 'normal'
  end;

  insert into public.reports (
    reporter_id, target_type, target_id, reason, description, evidence,
    status, priority, custom_request_id, conversation_id
  )
  values (
    v_user_id, p_target_type, btrim(p_target_id), p_reason, btrim(p_description),
    nullif(btrim(coalesce(p_evidence, '')), ''), 'open', v_priority,
    p_custom_request_id, p_conversation_id
  )
  returning * into v_report;

  return v_report;
end;
$$;

revoke all on function public.create_report(text,text,text,text,uuid,uuid,text)
  from public, anon;
grant execute on function public.create_report(text,text,text,text,uuid,uuid,text)
  to authenticated;

create or replace function public.review_report(
  p_report_id uuid,
  p_status text,
  p_decision text default null
)
returns public.reports
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_report public.reports;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'Acesso administrativo necessário.';
  end if;

  if p_status not in ('open','under_review','resolved','dismissed') then
    raise exception 'Status de denúncia inválido.';
  end if;

  update public.reports
  set
    status = p_status,
    reviewed_by = case when p_status = 'open' then null else v_admin_id end,
    reviewed_at = case when p_status = 'open' then null else now() end,
    decision = case
      when p_status = 'open' then null
      else nullif(btrim(coalesce(p_decision, '')), '')
    end
  where id = p_report_id
  returning * into v_report;

  if v_report.id is null then
    raise exception 'Denúncia não encontrada.';
  end if;

  return v_report;
end;
$$;

revoke all on function public.review_report(uuid,text,text) from public, anon;
grant execute on function public.review_report(uuid,text,text) to authenticated;

create or replace function public.list_admin_conversations(
  p_status text default null,
  p_query text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  conversation_id uuid,
  request_id uuid,
  request_status text,
  requester_name text,
  creator_name text,
  last_message_content text,
  last_message_at timestamptz,
  related_reports bigint,
  total_count bigint
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_status text := nullif(btrim(coalesce(p_status, '')), '');
  v_query text := lower(nullif(btrim(coalesce(p_query, '')), ''));
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 100));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Acesso administrativo necessário.';
  end if;

  return query
  with base as (
    select
      c.id as conversation_id,
      cr.id as request_id,
      cr.status as request_status,
      coalesce(requester.display_name, requester.username, 'Usuário') as requester_name,
      coalesce(creator.display_name, creator.username, 'Criador') as creator_name,
      last_message.content as last_message_content,
      c.last_message_at,
      (
        select count(*)::bigint
        from public.reports r
        where r.conversation_id = c.id
           or r.custom_request_id = cr.id
      ) as related_reports
    from public.conversations c
    join public.custom_requests cr on cr.id = c.custom_request_id
    left join public.profiles requester on requester.id = cr.requester_id
    left join public.profiles creator on creator.id = cr.creator_id
    left join lateral (
      select m.content
      from public.messages m
      where m.conversation_id = c.id
      order by m.created_at desc
      limit 1
    ) last_message on true
  ),
  filtered as (
    select *
    from base
    where (v_status is null or base.request_status = v_status)
      and (
        v_query is null
        or lower(base.requester_name) like '%' || v_query || '%'
        or lower(base.creator_name) like '%' || v_query || '%'
        or base.request_id::text like '%' || v_query || '%'
        or base.conversation_id::text like '%' || v_query || '%'
      )
  )
  select
    filtered.conversation_id,
    filtered.request_id,
    filtered.request_status,
    filtered.requester_name,
    filtered.creator_name,
    filtered.last_message_content,
    filtered.last_message_at,
    filtered.related_reports,
    count(*) over()::bigint as total_count
  from filtered
  order by filtered.last_message_at desc, filtered.conversation_id desc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.list_admin_conversations(text,text,integer,integer)
  from public, anon;
grant execute on function public.list_admin_conversations(text,text,integer,integer)
  to authenticated;
