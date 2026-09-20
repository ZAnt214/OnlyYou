import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Chamado pelo webhook do Mercado Pago (nunca pelo cliente) depois que
 * payment_confirmations confirma "paid" para um pagamento kind=product.
 * Usa o cliente de service role (contorna RLS): marca o pedido como pago e
 * concede o acesso real (product_entitlements) — é o único lugar da
 * aplicação que grava essa tabela, exatamente porque o comprador nunca
 * pode conceder acesso a si mesmo. Idempotente: só age se o pedido ainda
 * está "awaiting_payment"; o `on conflict do nothing` cobre reenvio de
 * notificação depois que o entitlement já existe.
 */
export async function activateProductOrderAfterPayment(orderId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: order, error: orderError } = await supabase
    .from("product_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    console.error(`[activateProductOrder] falha ao buscar pedido ${orderId}:`, orderError.message);
    return;
  }
  if (!order || order.status !== "awaiting_payment") {
    // Já processado, ou não é um pedido de produto (checkout personalizado).
    return;
  }

  const now = new Date().toISOString();

  const { error: updateOrderError } = await supabase
    .from("product_orders")
    .update({ status: "paid", paid_at: now })
    .eq("id", order.id);
  if (updateOrderError) {
    console.error(`[activateProductOrder] falha ao atualizar pedido ${order.id}:`, updateOrderError.message);
    return;
  }

  const { error: entitlementError } = await supabase
    .from("product_entitlements")
    .upsert(
      { product_id: order.product_id, buyer_id: order.buyer_id, order_id: order.id, status: "active" },
      { onConflict: "product_id,buyer_id" },
    );
  if (entitlementError) {
    console.error(`[activateProductOrder] falha ao conceder acesso (pedido ${order.id}):`, entitlementError.message);
    return;
  }

  const { data: product } = await supabase
    .from("products")
    .select("sales_count, title")
    .eq("id", order.product_id)
    .maybeSingle();
  if (product) {
    await supabase
      .from("products")
      .update({ sales_count: product.sales_count + 1 })
      .eq("id", order.product_id);
  }

  await supabase.from("notifications").insert([
    {
      user_id: order.creator_id,
      type: "PRODUCT_SOLD",
      title: "Produto vendido",
      body: product ? `Seu produto "${product.title}" foi comprado.` : "Um dos seus produtos foi comprado.",
      link_href: "/dashboard/vendas",
    },
    {
      user_id: order.buyer_id,
      type: "PRODUCT_PURCHASE_CONFIRMED",
      title: "Compra confirmada",
      body: "Seu pagamento foi confirmado. O produto já está disponível na sua biblioteca.",
      link_href: "/biblioteca",
    },
  ]);
}
