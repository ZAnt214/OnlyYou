import type { Order, Product, CustomProposal } from "@/lib/types";
import type { OrderRepository } from "@/lib/repositories/OrderRepository";

export class OrderService {
  constructor(private orderRepo: OrderRepository) {}

  /**
   * Cria um Order a partir de uma CustomProposal aceita, reaproveitando a
   * mesma estrutura de Order/Payment/Sale do checkout de produto — o "item"
   * do pedido é o serviço combinado na proposta, não um Product do catálogo.
   * Valores em Order permanecem em reais (não centavos) para não misturar
   * convenções dentro do mesmo tipo — a conversão acontece aqui, na borda.
   */
  createOrderForCustomProposal(requesterId: string, proposal: CustomProposal): Order {
    const unitPrice = proposal.priceCents / 100;
    const order: Order = {
      id: `order-${proposal.id}-${Date.now()}`,
      buyerId: requesterId,
      items: [
        {
          productId: proposal.id,
          productTitle: `${proposal.serviceType} — pedido personalizado`,
          creatorId: proposal.creatorId,
          unitPrice,
          quantity: 1,
          subtotal: unitPrice,
        },
      ],
      total: unitPrice,
      currency: "BRL",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.orderRepo.create(order);
    return order;
  }

  createOrderForProduct(buyerId: string, product: Product): Order {
    const unitPrice = product.promoPrice ?? product.price;
    const order: Order = {
      id: `order-${Date.now()}`,
      buyerId,
      items: [
        {
          productId: product.id,
          productTitle: product.title,
          creatorId: product.creatorId,
          unitPrice,
          quantity: 1,
          subtotal: unitPrice,
        },
      ],
      total: unitPrice,
      currency: "BRL",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.orderRepo.create(order);
    return order;
  }

  markPaid(orderId: string): void {
    this.orderRepo.updateStatus(orderId, "paid");
  }

  listForBuyer(buyerId: string): Order[] {
    return this.orderRepo.findByBuyer(buyerId);
  }
}
