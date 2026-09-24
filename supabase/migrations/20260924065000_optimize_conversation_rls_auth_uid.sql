-- Otimiza RLS de pedidos/conversas/notificações sem alterar quem pode acessar o quê.

alter policy "participants_select_custom_requests"
on public.custom_requests
using (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = creator_id
  or public.is_admin()
);

alter policy "requester_inserts_custom_requests"
on public.custom_requests
with check ((select auth.uid()) = requester_id);

alter policy "participants_update_custom_requests"
on public.custom_requests
using (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = creator_id
)
with check (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = creator_id
);

alter policy "participants_select_custom_service_orders"
on public.custom_service_orders
using (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = creator_id
  or public.is_admin()
);

alter policy "requester_inserts_custom_service_orders"
on public.custom_service_orders
with check ((select auth.uid()) = requester_id);

alter policy "participants_update_custom_service_orders"
on public.custom_service_orders
using (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = creator_id
)
with check (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = creator_id
);

alter policy "creator_inserts_custom_proposals"
on public.custom_proposals
with check ((select auth.uid()) = creator_id);

alter policy "participants_select_custom_proposals"
on public.custom_proposals
using (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = creator_id
  or public.is_admin()
);

alter policy "participants_update_custom_proposals"
on public.custom_proposals
using (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = creator_id
)
with check (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = creator_id
);

alter policy "participants_select_conversations"
on public.conversations
using (
  exists (
    select 1
    from public.custom_requests r
    where r.id = conversations.custom_request_id
      and (
        (select auth.uid()) = r.requester_id
        or (select auth.uid()) = r.creator_id
        or public.is_admin()
      )
  )
);

alter policy "requester_inserts_conversations"
on public.conversations
with check (
  exists (
    select 1
    from public.custom_requests r
    where r.id = conversations.custom_request_id
      and (select auth.uid()) = r.requester_id
  )
);

alter policy "participants_update_conversations"
on public.conversations
using (
  exists (
    select 1
    from public.custom_requests r
    where r.id = conversations.custom_request_id
      and (
        (select auth.uid()) = r.requester_id
        or (select auth.uid()) = r.creator_id
      )
  )
)
with check (
  exists (
    select 1
    from public.custom_requests r
    where r.id = conversations.custom_request_id
      and (
        (select auth.uid()) = r.requester_id
        or (select auth.uid()) = r.creator_id
      )
  )
);

alter policy "participants_select_messages"
on public.messages
using (
  exists (
    select 1
    from public.conversations c
    join public.custom_requests r on r.id = c.custom_request_id
    where c.id = messages.conversation_id
      and (
        (select auth.uid()) = r.requester_id
        or (select auth.uid()) = r.creator_id
        or public.is_admin()
      )
  )
);

alter policy "participants_insert_messages"
on public.messages
with check (
  (select auth.uid()) = sender_id
  and exists (
    select 1
    from public.conversations c
    join public.custom_requests r on r.id = c.custom_request_id
    where c.id = messages.conversation_id
      and (
        (select auth.uid()) = r.requester_id
        or (select auth.uid()) = r.creator_id
      )
  )
);

alter policy "sender_updates_own_messages"
on public.messages
using ((select auth.uid()) = sender_id)
with check ((select auth.uid()) = sender_id);

alter policy "participants_select_message_attachments"
on public.message_attachments
using (
  exists (
    select 1
    from public.custom_requests r
    where r.id = message_attachments.custom_request_id
      and (
        (select auth.uid()) = r.requester_id
        or (select auth.uid()) = r.creator_id
        or public.is_admin()
      )
  )
);

alter policy "uploader_inserts_message_attachments"
on public.message_attachments
with check (
  (select auth.uid()) = uploader_id
  and exists (
    select 1
    from public.custom_requests r
    where r.id = message_attachments.custom_request_id
      and (select auth.uid()) = r.creator_id
  )
);

alter policy "owner_selects_notifications"
on public.notifications
using ((select auth.uid()) = user_id);

alter policy "owner_marks_notification_read"
on public.notifications
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

alter policy "participant_inserts_notification_for_counterpart"
on public.notifications
with check (
  public.is_admin()
  or exists (
    select 1
    from public.custom_requests r
    where (
      r.requester_id = notifications.user_id
      and r.creator_id = (select auth.uid())
    )
    or (
      r.creator_id = notifications.user_id
      and r.requester_id = (select auth.uid())
    )
  )
);

alter policy "participants_select_disputes"
on public.disputes
using (
  exists (
    select 1
    from public.custom_service_orders cso
    where cso.id = disputes.custom_service_order_id
      and (
        (select auth.uid()) = cso.requester_id
        or (select auth.uid()) = cso.creator_id
        or public.is_admin()
      )
  )
);

alter policy "participant_inserts_dispute"
on public.disputes
with check (
  (select auth.uid()) = raised_by
  and exists (
    select 1
    from public.custom_service_orders cso
    where cso.id = disputes.custom_service_order_id
      and (
        (select auth.uid()) = cso.requester_id
        or (select auth.uid()) = cso.creator_id
      )
  )
);
