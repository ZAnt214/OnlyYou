import type { Order, Payment, Sale } from "@/lib/types";
import type { SaleRepository } from "@/lib/repositories/SaleRepository";
import { platformConfig } from "@/lib/security/config";

/**
 * Aplica a divisão de receita configurada em lib/security/config.ts e
 * registra a Sale (snapshot financeiro) correspondente ao pagamento
 * confirmado. Nenhum outro módulo deve recalcular esses valores.
 */
export class WalletService {
  constructor(private saleRepo: SaleRepository) {}

  registerSaleFromPayment(order: Order, payment: Payment): Sale {
    if (payment.status !== "paid") {
      throw new Error("Só é possível registrar uma venda para um pagamento confirmado (paid).");
    }

    const item = order.items[0];
    const grossAmount = payment.amount;
    const platformFee = round2(grossAmount * platformConfig.platformRevenueShare);
    const creatorAmount = round2(grossAmount * platformConfig.creatorRevenueShare);

    const sale: Sale = {
      id: `sale-${order.id}`,
      orderId: order.id,
      paymentId: payment.id,
      productId: item.productId,
      creatorId: item.creatorId,
      grossAmount,
      platformFee,
      creatorAmount,
      currency: "BRL",
      createdAt: new Date().toISOString(),
    };

    this.saleRepo.create(sale);
    return sale;
  }

  salesForCreator(creatorId: string): Sale[] {
    return this.saleRepo.findByCreator(creatorId);
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
