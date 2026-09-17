import type { Order, Payment, PaymentMethod } from "@/lib/types";
import type { PaymentRepository } from "@/lib/repositories/PaymentRepository";

interface CheckoutApiResult {
  paymentId: string;
  status: Payment["status"];
  redirectUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
}

interface StatusApiResult {
  status: Payment["status"];
  paid: boolean;
  confirmedAt: string | null;
}

/**
 * Fala com /api/mercadopago/* (nunca com o Mercado Pago diretamente — o
 * access token do criador e o access token da integradora só existem no
 * servidor). A autoridade sobre "o pagamento foi confirmado" é sempre o
 * servidor (payment_confirmations no Supabase, ver lib/payments/paymentConfirmations.ts);
 * este serviço só espelha esse resultado no Payment local (mock-session) para
 * a UI, nunca decide sozinho que algo foi pago.
 */
export class PaymentService {
  constructor(private paymentRepo: PaymentRepository) {}

  async startProductCheckout(order: Order, method: PaymentMethod): Promise<Payment> {
    const productId = order.items[0]?.productId;
    if (!productId) throw new Error("Pedido sem produto associado.");

    const result = await this.postCheckout({
      orderId: order.id,
      method,
      kind: "product",
      productId,
    });

    return this.savePaymentFromCheckout(order, method, result);
  }

  /**
   * Pedidos personalizados: o valor e o criador vêm da CustomProposal aceita,
   * que hoje só existe no mock-session do navegador (não há backend real
   * para propostas ainda) — por isso chegam como parâmetros em vez de serem
   * resolvidos no servidor a partir de um id, diferente do checkout de
   * produto. Limitação pré-existente do fluxo de pedidos personalizados,
   * não uma regressão desta mudança.
   */
  async startCustomServiceCheckout(
    order: Order,
    method: PaymentMethod,
    creatorId: string,
  ): Promise<Payment> {
    const result = await this.postCheckout({
      orderId: order.id,
      method,
      kind: "custom_service",
      creatorId,
      amount: order.total,
      description: order.items[0]?.productTitle ?? `Pedido ${order.id}`,
    });

    return this.savePaymentFromCheckout(order, method, result);
  }

  private async postCheckout(body: Record<string, unknown>): Promise<CheckoutApiResult> {
    const response = await fetch("/api/mercadopago/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? "Não foi possível iniciar o pagamento.");
    }
    return response.json();
  }

  private savePaymentFromCheckout(order: Order, method: PaymentMethod, result: CheckoutApiResult): Payment {
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
   * Consulta o status real (servidor) e sincroniza o Payment local. Usado
   * pelo polling da UI (MercadoPagoPixPanel, página de retorno do checkout)
   * até o status virar "paid". `mpPaymentIdHint` é opcional — usado no
   * retorno do Checkout Pro, quando o `payment_id` já veio na URL do
   * Mercado Pago mas o webhook pode não ter chegado ainda.
   */
  async syncStatus(orderId: string, mpPaymentIdHint?: string): Promise<Payment> {
    const params = new URLSearchParams({ orderId });
    if (mpPaymentIdHint) params.set("mpPaymentId", mpPaymentIdHint);

    const response = await fetch(`/api/mercadopago/status?${params.toString()}`);
    if (!response.ok) throw new Error("Não foi possível consultar o status do pagamento.");
    const data: StatusApiResult = await response.json();

    const existing = this.paymentRepo.findByOrder(orderId);
    if (!existing) throw new Error("Pagamento local não encontrado para este pedido.");

    this.paymentRepo.update(existing.id, {
      status: data.status,
      ...(data.paid ? { confirmedAt: data.confirmedAt ?? new Date().toISOString() } : {}),
    });

    const updated = this.paymentRepo.findById(existing.id);
    if (!updated) throw new Error("Pagamento não encontrado após sincronização.");
    return updated;
  }

  /**
   * Marca o Payment local como "paid". Só deve ser chamado depois que
   * syncStatus() confirmou junto ao servidor (payment_confirmations) que o
   * pagamento foi aprovado — nunca a partir de um clique de usuário ou do
   * simples retorno de navegação sem verificação.
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
