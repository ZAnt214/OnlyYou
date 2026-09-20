export type ProductOrderStatus = "awaiting_payment" | "paid" | "refunded" | "cancelled";

/**
 * Pedido de compra de um Produto — nasce ao clicar em "Comprar" (RPC
 * create_product_order) com o preço já travado, e vira o `orderId` levado
 * ao checkout do Mercado Pago (/api/mercadopago/checkout). Só o webhook
 * confirma o pagamento e concede o acesso (product_entitlements) — nunca o
 * navegador. Ver lib/payments/activateProductOrderAfterPayment.ts.
 */
export interface ProductOrder {
  id: string;
  productId: string;
  buyerId: string;
  creatorId: string;
  unitPriceCents: number;
  status: ProductOrderStatus;
  createdAt: string;
  paidAt?: string;
}
