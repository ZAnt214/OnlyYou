create index if not exists custom_order_reviews_reviewer_id_idx
  on public.custom_order_reviews (reviewer_id);

create index if not exists custom_proposals_conversation_id_idx
  on public.custom_proposals (conversation_id);
create index if not exists custom_proposals_creator_id_idx
  on public.custom_proposals (creator_id);
create index if not exists custom_proposals_requester_id_idx
  on public.custom_proposals (requester_id);

create index if not exists custom_requests_source_gig_id_idx
  on public.custom_requests (source_gig_id);

create index if not exists custom_service_orders_creator_id_idx
  on public.custom_service_orders (creator_id);
create index if not exists custom_service_orders_requester_id_idx
  on public.custom_service_orders (requester_id);

create index if not exists disputes_custom_request_id_idx
  on public.disputes (custom_request_id);
create index if not exists disputes_custom_service_order_id_idx
  on public.disputes (custom_service_order_id);
create index if not exists disputes_raised_by_idx
  on public.disputes (raised_by);

create index if not exists message_attachments_custom_request_id_idx
  on public.message_attachments (custom_request_id);
create index if not exists message_attachments_uploader_id_idx
  on public.message_attachments (uploader_id);

create index if not exists messages_custom_service_order_id_idx
  on public.messages (custom_service_order_id);
create index if not exists messages_proposal_id_idx
  on public.messages (proposal_id);
create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

create index if not exists product_entitlements_buyer_id_idx
  on public.product_entitlements (buyer_id);
create index if not exists product_entitlements_order_id_idx
  on public.product_entitlements (order_id);

create index if not exists product_files_creator_id_idx
  on public.product_files (creator_id);

create index if not exists product_orders_product_id_idx
  on public.product_orders (product_id);

create index if not exists withdrawals_creator_id_idx
  on public.withdrawals (creator_id);
create index if not exists withdrawals_reviewed_by_idx
  on public.withdrawals (reviewed_by);
