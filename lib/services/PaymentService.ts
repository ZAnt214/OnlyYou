import type { Order, Payment, PaymentMethod, PaymentStatus } from "@/lib/types";
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
      description: order.items[0]?.productTitle,
    });

    const payment: Payment = {
      id: result.paymentId,
      orderId: order.id,
      status: result.status,
      amount: order.total,
      currency: "BRL",
      method,
      createdAt: new Date().toISOString(),
      checkoutRedirectUrl: result.redirectUrl,
      checkoutQrCode: result.qrCode,
      checkoutQrCodeBase64: result.qrCodeBase64,
      checkoutExpiresAt: result.expiresAt,
    };
    this.paymentRepo.create(payment);
    return payment;
  }

  /**
   * Consulta o status real do pagamento junto ao Mercado Pago e sincroniza
   * o Payment local. Usado pelo polling da UI (MercadoPagoPixPanel e a
   * página de retorno do checkout) até o status virar "paid".
   */
  async syncStatus(paymentId: string): Promise<Payment> {
    const status: PaymentStatus = await this.provider.getPaymentStatus(paymentId);
    this.paymentRepo.update(paymentId, {
      status,
      ...(status === "paid" ? { confirmedAt: new Date().toISOString() } : {}),
    });
    const payment = this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error("Pagamento não encontrado após sincronização.");
    return payment;
  }

  /**
   * Usado no retorno do Checkout Pro (cartão/boleto): o Payment local foi
   * criado com o id da preference, mas o pagamento real só existe (com seu
   * próprio id) depois que a pessoa paga na página do Mercado Pago. Aqui
   * consultamos o status pelo id real (vindo da query string de retorno) e,
   * se aprovado, sincronizamos o Payment local mantendo o id original usado
   * pelo resto do app (Order, Sale, Entitlement).
   */
  async confirmFromMercadoPagoReturn(localPaymentId: string, mercadoPagoPaymentId: string): Promise<Payment> {
    const status = await this.provider.getPaymentStatus(mercadoPagoPaymentId);
    this.paymentRepo.update(localPaymentId, {
      status,
      ...(status === "paid" ? { confirmedAt: new Date().toISOString() } : {}),
    });
    const payment = this.paymentRepo.findById(localPaymentId);
    if (!payment) throw new Error("Pagamento não encontrado após sincronização.");
    return payment;
  }

  /**
   * Marca o Payment local como "paid". Só deve ser chamado depois que
   * syncStatus()/confirmFromMercadoPagoReturn() confirmaram junto ao
   * Mercado Pago que o pagamento foi aprovado — nunca a partir de um clique
   * de usuário sem verificação.
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
