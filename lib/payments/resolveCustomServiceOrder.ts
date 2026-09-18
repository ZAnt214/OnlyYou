import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface ResolvedCustomServiceOrder {
  orderId: string;
  requesterId: string;
  creatorId: string;
  amountCents: number;
  description: string;
}

/**
 * Resolve valor/criador de um pedido personalizado SEMPRE no servidor, a
 * partir do `order_id`. Usa o cliente Supabase autenticado (cookies), então
 * a RLS já restringe a linha ao próprio solicitante — a checagem explícita
 * de requester_id abaixo é defesa em profundidade. Retorna null quando o
 * pedido não existe ou não é de quem está pedindo (quem chama devolve 404
 * nos dois casos, sem diferenciar).
 */
export async function resolveCustomServiceOrderForBuyer(
  orderId: string,
  buyerId: string,
): Promise<ResolvedCustomServiceOrder | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("custom_service_orders")
    .select("order_id, requester_id, creator_id, agreed_amount_cents, service_type")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.requester_id !== buyerId) return null;

  return {
    orderId: data.order_id,
    requesterId: data.requester_id,
    creatorId: data.creator_id,
    amountCents: data.agreed_amount_cents,
    description: `${data.service_type} — pedido personalizado`,
  };
}
