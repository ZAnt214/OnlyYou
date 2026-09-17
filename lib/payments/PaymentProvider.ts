// Processador de pagamentos: Mercado Pago, no modelo de marketplace (split
// automático entre Jobê e o criador via conta conectada por OAuth). Ver
// lib/payments/MercadoPagoMarketplaceProvider.ts para a implementação real e
// lib/payments/getServerPaymentProvider.ts para a seleção mock/real.

import type { PaymentMethod, PaymentStatus } from "@/lib/types";

export interface CreateCheckoutInput {
  /** Id do pedido interno — vira `external_reference` no Mercado Pago. */
  orderId: string;
  /** Valor em reais, calculado pelo servidor — nunca vindo do cliente. */
  amount: number;
  method: PaymentMethod;
  description?: string;
  payerEmail?: string;
  /** Access token OAuth do criador conectado — o pagamento é criado em nome dele. */
  sellerAccessToken: string;
  /** Parte retida pela plataforma (reais), descontada automaticamente pelo Mercado Pago. */
  marketplaceFeeAmount: number;
}

export interface CreateCheckoutResult {
  /** Id real do pagamento (Pix) ou da preference (Checkout Pro). */
  paymentId: string;
  status: PaymentStatus;
  /** URL de checkout hospedado pelo Mercado Pago (cartão/boleto — Checkout Pro). */
  redirectUrl?: string;
  /** Copia-e-cola do Pix. */
  qrCode?: string;
  /** QR code do Pix em base64 (image/png). */
  qrCodeBase64?: string;
  expiresAt?: string;
}

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  getPaymentStatus(mpPaymentId: string): Promise<PaymentStatus>;
  refund(mpPaymentId: string): Promise<void>;
}

/**
 * Implementação simulada usada como fallback de desenvolvimento quando
 * PAYMENT_PROVIDER=mock ou quando as credenciais do Mercado Pago não estão
 * configuradas (ver getServerPaymentProvider). Nenhuma cobrança real
 * acontece: nasce "pending" e nunca muda de status sozinha — em dev, use
 * PAYMENT_PROVIDER=mock e confirme manualmente via SQL/dashboard se precisar
 * testar o caminho "paid" sem credenciais reais.
 */
export class MockPaymentProvider implements PaymentProvider {
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    return {
      paymentId: `mock-${input.orderId}-${Date.now()}`,
      status: "pending",
    };
  }

  async getPaymentStatus(): Promise<PaymentStatus> {
    return "pending";
  }

  async refund(): Promise<void> {
    // Em um provedor real, isso acionaria o estorno junto ao gateway.
  }
}

export function isPaidStatus(status: PaymentStatus): boolean {
  return status === "paid";
}
