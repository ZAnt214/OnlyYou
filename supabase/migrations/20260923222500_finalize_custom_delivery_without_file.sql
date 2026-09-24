create or replace function public.finalize_custom_delivery(
  p_custom_service_order_id uuid
)
returns public.custom_service_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creator_id uuid := auth.uid();
  v_cso public.custom_service_orders;
  v_conversation_id uuid;
begin
  if v_creator_id is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  select *
  into v_cso
  from public.custom_service_orders
  where id = p_custom_service_order_id;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_cso.creator_id <> v_creator_id then
    raise exception 'Só o criador pode finalizar este trabalho.';
  end if;

  if v_cso.status <> 'in_progress' then
    raise exception 'Este pedido não está em produção.';
  end if;

  select id
  into v_conversation_id
  from public.conversations
  where custom_request_id = v_cso.custom_request_id;

  insert into public.messages (
    conversation_id,
    sender_id,
    type,
    content,
    custom_service_order_id
  )
  values (
    v_conversation_id,
    v_creator_id,
    'system',
    'O criador marcou o trabalho como concluído. Aguarde a confirmação do comprador.',
    v_cso.id
  );

  update public.conversations
  set updated_at = now(),
      last_message_at = now()
  where id = v_conversation_id;

  update public.custom_service_orders
  set status = 'delivered',
      delivered_at = now()
  where id = v_cso.id
  returning * into v_cso;

  update public.custom_requests
  set status = 'delivered',
      updated_at = now()
  where id = v_cso.custom_request_id;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    link_href
  )
  values (
    v_cso.requester_id,
    'CUSTOM_DELIVERY_SENT',
    'Trabalho finalizado',
    'O criador informou que concluiu o trabalho. Confira a conversa e confirme o recebimento ou relate um problema.',
    '/pedidos/' || v_cso.custom_request_id::text
  );

  return v_cso;
end;
$$;

revoke all on function public.finalize_custom_delivery(uuid) from public, anon;
grant execute on function public.finalize_custom_delivery(uuid) to authenticated;
