import "server-only";
import type { PaymentStatus } from "@/lib/types";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
} from "@/lib/payments/PaymentProvider";

const MP_API = "https://api.mercadopago.com";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} não configurada.`);
  return value;
}

/** Access token da própria integradora (app do Jobê) — usado para consultar
 * pagamentos criados em nome de contas conectadas via OAuth (o app integrador
 * sempre tem visibilidade sobre pagamentos do seu próprio ecossistema) e para
 * estornos. A criação do pagamento em si usa o access token do CRIADOR
 * (sellerAccessToken), para que o valor caia na conta dele com o
 * marketplace_fee/application_fee retido automaticamente para a plataforma. */
function platformAccessToken(): string {
  return requiredEnv("MERCADOPAGO_ACCESS_TOKEN");
}

/**
 * Provedor real de pagamentos via Mercado Pago no modelo de marketplace.
 * Só deve ser importado em código de servidor — nunca em um componente de
 * cliente. Ver app/api/mercadopago/checkout/route.ts (validação de
 * produto/criador/valor sempre no servidor, split calculado a partir de
 * lib/security/config.ts).
 */
export class MercadoPagoMarketplaceProvider implements PaymentProvider {
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    if (input.method === "pix") {
      return this.createPixPayment(input);
    }
    return this.createPreference(input);
  }

  private async createPixPayment(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const res = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.sellerAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${input.orderId}-pix`,
      },
      body: JSON.stringify({
        transaction_amount: round2(input.amount),
        description: input.description ?? `Pedido ${input.orderId}`,
        payment_method_id: "pix",
        external_reference: input.orderId,
        application_fee: round2(input.marketplaceFeeAmount),
        notification_url: `${requiredEnv("NEXT_PUBLIC_APP_URL")}/api/mercadopago/webhook`,
        payer: { email: input.payerEmail ?? "comprador@jobe.app" },
      }),
    });

    const data = await parseOrThrow(res, "Falha ao criar pagamento Pix no Mercado Pago.");
    const txData = data.point_of_interaction?.transaction_data;

    return {
      paymentId: String(data.id),
      status: mapMercadoPagoStatus(data.status),
      qrCode: txData?.qr_code,
      qrCodeBase64: txData?.qr_code_base64,
      expiresAt: data.date_of_expiration ?? undefined,
    };
  }

  private async createPreference(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");

    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.sellerAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: input.orderId,
            title: input.description ?? `Pedido ${input.orderId}`,
            quantity: 1,
            unit_price: round2(input.amount),
            currency_id: "BRL",
          },
        ],
        external_reference: input.orderId,
        marketplace_fee: round2(input.marketplaceFeeAmount),
        payer: input.payerEmail ? { email: input.payerEmail } : undefined,
        payment_methods:
          input.method === "boleto"
            ? { excluded_payment_types: [{ id: "credit_card" }, { id: "debit_card" }] }
            : { excluded_payment_types: [{ id: "ticket" }] },
        back_urls: {
          success: `${appUrl}/checkout/retorno?orderId=${input.orderId}`,
          failure: `${appUrl}/checkout/retorno?orderId=${input.orderId}`,
          pending: `${appUrl}/checkout/retorno?orderId=${input.orderId}`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/mercadopago/webhook`,
      }),
    });

    const data = await parseOrThrow(res, "Falha ao criar checkout no Mercado Pago.");

    return {
      paymentId: String(data.id),
      status: "pending",
      redirectUrl: data.init_point ?? undefined,
      expiresAt: data.expiration_date_to ?? undefined,
    };
  }

  /** Consulta usando o token da própria integradora — funciona para qualquer
   * pagamento criado dentro do ecossistema OAuth deste app. */
  async getPaymentStatus(mpPaymentId: string): Promise<PaymentStatus> {
    const res = await fetch(`${MP_API}/v1/payments/${mpPaymentId}`, {
      headers: { Authorization: `Bearer ${platformAccessToken()}` },
    });
    if (!res.ok) return "pending";
    const data = await res.json();
    return mapMercadoPagoStatus(data.status);
  }

  async refund(mpPaymentId: string): Promise<void> {
    const res = await fetch(`${MP_API}/v1/payments/${mpPaymentId}/refunds`, {
      method: "POST",
      headers: { Authorization: `Bearer ${platformAccessToken()}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (typeof err.message === "string" && err.message) || "Falha ao estornar pagamento no Mercado Pago.",
      );
    }
  }
}

/** Busca um pagamento pelo id usando o token da integradora — usado pelo
 * webhook para nunca confiar cegamente no payload recebido. */
export async function fetchMercadoPagoPayment(mpPaymentId: string): Promise<{
  id: string;
  status: string;
  externalReference: string | null;
  transactionAmount: number | null;
  collectorId: string | null;
  paymentMethodId: string | null;
} | null> {
  const res = await fetch(`${MP_API}/v1/payments/${mpPaymentId}`, {
    headers: { Authorization: `Bearer ${platformAccessToken()}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: String(data.id),
    status: String(data.status || ""),
    externalReference: typeof data.external_reference === "string" ? data.external_reference : null,
    transactionAmount: typeof data.transaction_amount === "number" ? data.transaction_amount : null,
    collectorId: data.collector_id != null ? String(data.collector_id) : null,
    paymentMethodId: typeof data.payment_method_id === "string" ? data.payment_method_id : null,
  };
}

export function mapMercadoPagoStatus(status?: string | null): PaymentStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "in_process":
    case "authorized":
    case "in_mediation":
      return "processing";
    case "rejected":
    case "cancelled":
      return "failed";
    case "refunded":
      return "refunded";
    case "charged_back":
      return "chargeback";
    case "pending":
    default:
      return "pending";
  }
}

async function parseOrThrow(res: Response, fallbackMessage: string) {
  if (res.ok) return res.json();
  const err = await res.json().catch(() => ({}));
  const message =
    (typeof err.message === "string" && err.message) ||
    (Array.isArray(err.cause) && err.cause[0]?.description) ||
    fallbackMessage;
  throw new Error(message);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
