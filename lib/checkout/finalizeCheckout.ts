import type { Order, Payment } from "@/lib/types";
import type { OrderService } from "@/lib/services/OrderService";
import type { WalletService } from "@/lib/services/WalletService";
import type { EntitlementService } from "@/lib/services/EntitlementService";

/**
 * Sequência aplicada assim que um pagamento de produto é confirmado como
 * "paid" (Order -> Sale -> Entitlement). Compartilhada entre o fluxo de
 * checkout normal (CheckoutFlow) e a página de retorno do Mercado Pago
 * (Checkout Pro), que reconstrói o pedido a partir do mock-session.
 */
export function finalizeProductCheckout(params: {
  order: Order;
  payment: Payment;
  userId: string;
  productId: string;
  orderService: OrderService;
  walletService: WalletService;
  entitlementService: EntitlementService;
}): void {
  const { order, payment, userId, productId, orderService, walletService, entitlementService } = params;

  orderService.markPaid(order.id);
  walletService.registerSaleFromPayment(order, payment);
  entitlementService.grantFromOrder({
    userId,
    productId,
    orderId: order.id,
    paymentId: payment.id,
  });
}
