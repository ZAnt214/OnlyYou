import type { Order, Payment, PaymentMethod } from "@/lib/types";
import type { PaymentRepository } from "@/lib/repositories/PaymentRepository";
import type { PaymentProvider } from "@/lib/payments/PaymentProvider";

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private provider: PaymentProvider,
  ) {}

  async startPayment(order: Order, method: PaymentMethod): Promise<Payment> {
    const result = await this.provider.createCheckout({
      orderId: order.id,
      amount: order.total,
      method,
    });

    const payment: Payment = {
      id: result.paymentId,
      orderId: order.id,
      status: result.status,
      amount: order.total,
      currency: "BRL",
      method,
      createdAt: new Date().toISOString(),
    };
    this.paymentRepo.create(payment);
    return payment;
  }

  /**
   * Simula a confirmação do pagamento (equivalente a um webhook "paid" do
   * provedor real). Usado pela tela de checkout mock para avançar o fluxo.
   */
  confirmPayment(paymentId: string): Payment {
    this.paymentRepo.update(paymentId, {
      status: "paid",
      confirmedAt: new Date().toISOString(),
    });
    const payment = this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error("Pagamento não encontrado após confirmação.");
    return payment;
  }

  findByOrder(orderId: string): Payment | null {
    return this.paymentRepo.findByOrder(orderId);
  }
}
