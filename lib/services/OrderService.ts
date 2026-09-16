import type { Order, Product } from "@/lib/types";
import type { OrderRepository } from "@/lib/repositories/OrderRepository";

export class OrderService {
  constructor(private orderRepo: OrderRepository) {}

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
