import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Chamado pelo webhook do Mercado Pago (nunca pelo cliente) depois que
 * payment_confirmations confirma "paid" para um pagamento kind=custom_service.
 * Usa o cliente de service role (contorna RLS) para fazer a mesma transição
 * que CustomOrderService.confirmPaymentAndStart() fazia no mock — mas agora
 * disparada pela confirmação real do pagamento, nunca por uma chamada do
 * navegador. Idempotente: só age se o pedido ainda está "awaiting_payment".
 */
export async function activateCustomServiceOrderAfterPayment(orderId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: cso, error: csoError } = await supabase
    .from("custom_service_orders")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (csoError) {
    console.error(`[activateCustomServiceOrder] falha ao buscar pedido order_id=${orderId}:`, csoError.message);
    return;
  }
  if (!cso || cso.status !== "awaiting_payment") {
    // Já processado, ou não é um pedido personalizado (checkout de produto).
    return;
  }

  const { data: proposal } = await supabase
    .from("custom_proposals")
    .select("delivery_days")
    .eq("id", cso.proposal_id)
    .maybeSingle();

  const now = new Date().toISOString();
  const deliveryDeadlineAt = proposal
    ? new Date(Date.now() + proposal.delivery_days * 24 * 60 * 60 * 1000).toISOString()
    : cso.delivery_deadline_at;

  const { error: updateCsoError } = await supabase
    .from("custom_service_orders")
    .update({ status: "in_progress", started_at: now, delivery_deadline_at: deliveryDeadlineAt })
    .eq("id", cso.id);
  if (updateCsoError) {
    console.error(`[activateCustomServiceOrder] falha ao atualizar pedido ${cso.id}:`, updateCsoError.message);
    return;
  }

  if (proposal) {
    await supabase
      .from("custom_proposals")
      .update({ delivery_deadline_at: deliveryDeadlineAt })
      .eq("id", cso.proposal_id);
  }

  await supabase
    .from("custom_requests")
    .update({ status: "in_progress", updated_at: now })
    .eq("id", cso.custom_request_id);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("custom_request_id", cso.custom_request_id)
    .maybeSingle();

  if (conversation) {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: cso.requester_id,
      type: "system",
      content: "Pagamento confirmado. Pedido em produção.",
      custom_service_order_id: cso.id,
    });
    await supabase
      .from("conversations")
      .update({ updated_at: now, last_message_at: now })
      .eq("id", conversation.id);
  }

  await supabase.from("notifications").insert([
    {
      user_id: cso.creator_id,
      type: "CUSTOM_PAYMENT_CONFIRMED",
      title: "Pagamento confirmado",
      body: "O pagamento foi confirmado. Você já pode iniciar a produção deste pedido.",
      link_href: `/dashboard/pedidos-personalizados/${cso.custom_request_id}`,
    },
    {
      user_id: cso.requester_id,
      type: "CUSTOM_SERVICE_STARTED",
      title: "Serviço iniciado",
      body: "Seu pagamento foi confirmado e a produção do seu pedido já começou.",
      link_href: `/pedidos/${cso.custom_request_id}`,
    },
  ]);
}
