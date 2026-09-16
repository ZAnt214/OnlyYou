// TODO(integração):
// Selecionar e validar formalmente um processador de pagamentos
// compatível com o modelo específico do OnlyYou (marketplace de
// conteúdo adulto, venda individual, divisão de comissões, saques
// para criadores, chargebacks, reembolsos) antes de qualquer
// integração real. A disponibilidade de processamento depende das
// políticas atuais do provedor, da jurisdição, do tipo de conteúdo,
// do modelo comercial e da aprovação da conta — não presumir que
// um gateway genérico (Stripe/PayPal/Mercado Pago padrão) aceita
// este modelo sem validação formal. Exemplos de provedores
// especializados a avaliar (não decididos): CCBill, Segpay, Epoch,
// Verotel.

import type { Payment, PaymentMethod, PaymentStatus } from "@/lib/types";

export interface CreateCheckoutInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
}

export interface CreateCheckoutResult {
  paymentId: string;
  status: PaymentStatus;
}

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  handleWebhook(payload: unknown): Promise<void>;
  refund(paymentId: string): Promise<void>;
}

/**
 * Implementação simulada: nenhuma cobrança real acontece. O pagamento nasce
 * "pending" e é confirmado manualmente pela pessoa usuária (simulando o
 * webhook de confirmação) através de PaymentService.confirmPayment().
 */
export class MockPaymentProvider implements PaymentProvider {
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    return {
      paymentId: `pay-${input.orderId}-${Date.now()}`,
      status: "pending",
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    void paymentId;
    // Em um provedor real, isso consultaria a API do gateway de pagamento.
    return "pending";
  }

  async handleWebhook(payload: unknown): Promise<void> {
    void payload;
    // Em um provedor real, isso validaria a assinatura do webhook e
    // atualizaria o status do pagamento correspondente.
  }

  async refund(paymentId: string): Promise<void> {
    void paymentId;
    // Em um provedor real, isso acionaria o estorno junto ao gateway.
  }
}

export function isPaidStatus(status: PaymentStatus): boolean {
  return status === "paid";
}

export type { Payment };
