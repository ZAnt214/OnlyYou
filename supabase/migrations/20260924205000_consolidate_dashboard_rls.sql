-- Consolida políticas permissivas equivalentes para reduzir custo de RLS
-- sem ampliar as permissões existentes.

-- CONVERSATIONS: requester OU creator de oportunidade pode criar.
drop policy if exists creator_inserts_opportunity_conversations on public.conversations;
drop policy if exists requester_inserts_conversations on public.conversations;

create policy conversations_insert_participant
on public.conversations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.custom_requests r
    where r.id = conversations.custom_request_id
      and (
        r.requester_id = (select auth.uid())
        or (
          r.creator_id = (select auth.uid())
          and r.source_service_request_id is not null
        )
      )
  )
);

-- CUSTOM REQUESTS: mantém os dois caminhos existentes em uma única policy.
drop policy if exists creator_inserts_request_from_opportunity on public.custom_requests;
drop policy if exists requester_inserts_custom_requests on public.custom_requests;

create policy custom_requests_insert_authorized
on public.custom_requests
for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  or (
    creator_id = (select auth.uid())
    and requester_id <> creator_id
    and source_service_request_id is not null
    and exists (
      select 1
      from public.service_requests sr
      where sr.id = custom_requests.source_service_request_id
        and sr.requester_id = custom_requests.requester_id
        and sr.status = 'open'
        and sr.expires_at > now()
    )
  )
);

-- GIGS: anon vê ativos; autenticado vê ativos OU os próprios.
drop policy if exists public_select_active_gigs on public.gigs;
drop policy if exists owner_select_own_gigs on public.gigs;

create policy gigs_select_public
on public.gigs
for select
to anon
using (status = 'active');

create policy gigs_select_authenticated
on public.gigs
for select
to authenticated
using (
  status = 'active'
  or creator_id = (select auth.uid())
);

-- PRODUCTS: anon vê aprovados; autenticado vê aprovados, próprios ou comprados.
drop policy if exists products_select_public on public.products;
drop policy if exists products_select_own on public.products;
drop policy if exists products_select_entitled_buyer on public.products;

create policy products_select_public
on public.products
for select
to anon
using (status = 'approved');

create policy products_select_authenticated
on public.products
for select
to authenticated
using (
  status = 'approved'
  or creator_id = (select auth.uid())
  or exists (
    select 1
    from public.product_entitlements pe
    where pe.product_id = products.id
      and pe.buyer_id = (select auth.uid())
      and pe.status = 'active'
  )
);
