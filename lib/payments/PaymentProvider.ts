// Processador de pagamentos: Mercado Pago (decisão de produto).
//
// Aviso mantido para quem for operar a conta em produção: o Mercado Pago,
// como a maioria dos gateways generalistas, restringe merchants de conteúdo
// adulto em seus termos de uso. A aprovação da conta, o modelo de split para
// criadores e o tratamento de chargebacks/reembolsos dependem de validação
// direta com o Mercado Pago (ou, se a conta for recusada/suspensa, de
// migração para um provedor especializado como CCBill, Segpay, Epoch ou
// Verotel). Este módulo assume que essa validação já foi feita.

import type { Payment, PaymentMethod, PaymentStatus } from "@/lib/types";

export interface CreateCheckoutInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  description?: string;
  payerEmail?: string;
}

export interface CreateCheckoutResult {
  paymentId: string;
  status: PaymentStatus;
  /** URL de checkout hospedado pelo Mercado Pago (cartão/boleto — Checkout Pro). */
  redirectUrl?: string;
  /** Copia-e-cola do Pix. */
  qrCode?: string;
  /** QR code do Pix em base64 (image/png), pronto para <img src="data:image/png;base64,...">. */
  qrCodeBase64?: string;
  /** Momento em que o QR/preferência expira (ISO 8601). */
  expiresAt?: string;
}

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  handleWebhook(payload: unknown): Promise<void>;
  refund(paymentId: string): Promise<void>;
}

/**
 * Implementação simulada usada apenas como fallback de desenvolvimento
 * quando MERCADOPAGO_ACCESS_TOKEN não está configurado. Nenhuma cobrança
 * real acontece: o pagamento nasce "pending" e é confirmado manualmente
 * através de PaymentService.confirmPayment().
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
    return "pending";
  }

  async handleWebhook(payload: unknown): Promise<void> {
    void payload;
  }

  async refund(paymentId: string): Promise<void> {
    void paymentId;
  }
}

export function isPaidStatus(status: PaymentStatus): boolean {
  return status === "paid";
}

export type { Payment };
