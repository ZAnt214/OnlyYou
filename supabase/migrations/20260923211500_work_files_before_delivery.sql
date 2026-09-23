-- Arquivos de revisão/progresso são mensagens normais do chat.
-- O envio NÃO altera custom_service_orders.status; a entrega final continua
-- exclusiva da RPC send_custom_delivery().
create or replace function public.send_custom_attachment(
  p_conversation_id uuid,
  p_custom_service_order_id uuid,
  p_content text,
  p_attachments jsonb
)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.custom_service_orders%rowtype;
  v_message public.messages%rowtype;
  v_attachment jsonb;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_order
  from public.custom_service_orders
  where id = p_custom_service_order_id;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.creator_id <> v_user_id then
    raise exception 'CREATOR_ONLY';
  end if;

  if v_order.status <> 'in_progress' then
    raise exception 'ORDER_NOT_IN_PROGRESS';
  end if;

  if not exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and c.custom_request_id = v_order.custom_request_id
      and c.status = 'open'
  ) then
    raise exception 'CONVERSATION_NOT_FOUND';
  end if;

  if p_attachments is null
     or jsonb_typeof(p_attachments) <> 'array'
     or jsonb_array_length(p_attachments) < 1
     or jsonb_array_length(p_attachments) > 5 then
    raise exception 'INVALID_ATTACHMENTS';
  end if;

  -- Reutiliza a RPC existente para manter validação de participante,
  -- last_message_at e notificação de nova mensagem consistentes.
  select *
  into v_message
  from public.send_custom_message(
    p_conversation_id,
    coalesce(nullif(btrim(p_content), ''), 'Arquivo enviado para revisão.')
  );

  update public.messages
  set type = 'attachment',
      custom_service_order_id = p_custom_service_order_id
  where id = v_message.id
  returning * into v_message;

  for v_attachment in
    select value from jsonb_array_elements(p_attachments)
  loop
    if length(btrim(coalesce(v_attachment->>'file_name', ''))) not between 1 and 255
       or length(btrim(coalesce(v_attachment->>'mime_type', ''))) not between 1 and 255
       or length(btrim(coalesce(v_attachment->>'storage_key', ''))) not between 1 and 2048
       or coalesce((v_attachment->>'size_bytes')::bigint, 0) <= 0
       or (v_attachment->>'size_bytes')::bigint > 209715200 then
      raise exception 'INVALID_ATTACHMENT';
    end if;

    insert into public.message_attachments (
      message_id,
      custom_request_id,
      uploader_id,
      file_name,
      mime_type,
      size_bytes,
      storage_key
    )
    values (
      v_message.id,
      v_order.custom_request_id,
      v_user_id,
      btrim(v_attachment->>'file_name'),
      btrim(v_attachment->>'mime_type'),
      (v_attachment->>'size_bytes')::bigint,
      btrim(v_attachment->>'storage_key')
    );
  end loop;

  return v_message;
end;
$$;

revoke all on function public.send_custom_attachment(uuid, uuid, text, jsonb) from public, anon;
grant execute on function public.send_custom_attachment(uuid, uuid, text, jsonb) to authenticated;
