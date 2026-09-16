import "server-only";
import { MercadoPagoConfig, Payment as MPPayment, Preference, PaymentRefund } from "mercadopago";
import type { PaymentStatus } from "@/lib/types";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
} from "@/lib/payments/PaymentProvider";

/**
 * Provedor real de pagamentos via Mercado Pago. Só deve ser importado em
 * código de servidor (API routes) — usa MERCADOPAGO_ACCESS_TOKEN, que nunca
 * pode chegar ao navegador. Componentes/hooks de cliente devem usar
 * HttpMercadoPagoProvider, que fala com este provider através das rotas em
 * app/api/mercadopago/*.
 */
export class MercadoPagoProvider implements PaymentProvider {
  private client: MercadoPagoConfig;

  constructor(accessToken: string = requiredEnv("MERCADOPAGO_ACCESS_TOKEN")) {
    this.client = new MercadoPagoConfig({ accessToken });
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    if (input.method === "pix") {
      return this.createPixPayment(input);
    }
    return this.createPreference(input);
  }

  private async createPixPayment(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const payment = new MPPayment(this.client);
    const result = await payment.create({
      body: {
        transaction_amount: round2(input.amount),
        description: input.description ?? `Pedido ${input.orderId}`,
        payment_method_id: "pix",
        external_reference: input.orderId,
        payer: { email: input.payerEmail ?? "comprador@onlyyou.app" },
      },
    });

    const txData = result.point_of_interaction?.transaction_data;
    return {
      paymentId: String(result.id),
      status: mapMercadoPagoStatus(result.status),
      qrCode: txData?.qr_code,
      qrCodeBase64: txData?.qr_code_base64,
      expiresAt: result.date_of_expiration ?? undefined,
    };
  }

  private async createPreference(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");
    const preference = new Preference(this.client);
    const result = await preference.create({
      body: {
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
      },
    });

    return {
      paymentId: String(result.id),
      status: "pending",
      redirectUrl: result.init_point ?? undefined,
      expiresAt: result.expiration_date_to ?? undefined,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = new MPPayment(this.client);
    const result = await payment.get({ id: paymentId });
    return mapMercadoPagoStatus(result.status);
  }

  /**
   * Valida e interpreta a notificação recebida em /api/mercadopago/webhook.
   * Este protótipo não tem banco de dados persistente no servidor (o estado
   * de pedidos/pagamentos vive no mock-session do navegador), então a
   * confirmação efetiva do pagamento acontece por polling client-side em
   * /api/mercadopago/status. Em produção, é aqui que o status seria
   * persistido e o webhook passaria a ser a fonte de verdade.
   */
  async handleWebhook(payload: unknown): Promise<void> {
    const notification = payload as { type?: string; topic?: string; data?: { id?: string } };
    const type = notification.type ?? notification.topic;
    const id = notification.data?.id;
    if (type !== "payment" || !id) return;

    const payment = new MPPayment(this.client);
    await payment.get({ id });
  }

  async refund(paymentId: string): Promise<void> {
    const refund = new PaymentRefund(this.client);
    await refund.create({ payment_id: paymentId });
  }
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} não configurada.`);
  return value;
}
