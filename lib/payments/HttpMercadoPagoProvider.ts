import type { PaymentStatus } from "@/lib/types";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
} from "@/lib/payments/PaymentProvider";

/**
 * PaymentProvider seguro para uso em componentes de cliente: nunca lida com
 * o access token do Mercado Pago, apenas chama as API routes de
 * app/api/mercadopago/*, que rodam no servidor com MercadoPagoProvider.
 */
export class HttpMercadoPagoProvider implements PaymentProvider {
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const response = await fetch("/api/mercadopago/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error("Não foi possível iniciar o pagamento.");
    }
    return response.json();
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const response = await fetch(`/api/mercadopago/status?paymentId=${encodeURIComponent(paymentId)}`);
    if (!response.ok) {
      throw new Error("Não foi possível consultar o status do pagamento.");
    }
    const data = (await response.json()) as { status: PaymentStatus };
    return data.status;
  }

  async handleWebhook(): Promise<void> {
    // Webhooks são recebidos diretamente pelo servidor em
    // /api/mercadopago/webhook — não fazem sentido a partir do cliente.
    throw new Error("handleWebhook não é suportado no cliente.");
  }

  async refund(paymentId: string): Promise<void> {
    const response = await fetch("/api/mercadopago/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    if (!response.ok) {
      throw new Error("Não foi possível estornar o pagamento.");
    }
  }
}
