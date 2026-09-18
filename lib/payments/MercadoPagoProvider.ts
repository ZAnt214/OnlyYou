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

/** Access token único da conta do Jobê no Mercado Pago — toda cobrança da
 * plataforma (produto ou pedido personalizado) é criada nesta conta, nunca
 * na de um criador. O repasse ao criador acontece por fora do Mercado Pago:
 * o valor líquido (já descontada a comissão) vira saldo disponível na
 * carteira dele (ver lib/supabase/wallet.ts) e o saque é feito manualmente
 * pela administração — não há split automático nem OAuth por criador. */
function platformAccessToken(): string {
  return requiredEnv("MERCADOPAGO_ACCESS_TOKEN");
}

/**
 * Base pública do app, normalizada. O valor vem de uma variável de ambiente
 * colada à mão no painel de deploy, então espaço/quebra de linha no fim e
 * protocolo faltando são erros comuns — e o Mercado Pago recusa a cobrança
 * inteira com "notification_url attribute must be url valid" quando a URL
 * sai malformada. Normalizar aqui é mais seguro do que confiar no valor.
 */
function appUrl(): string {
  const raw = requiredEnv("NEXT_PUBLIC_APP_URL").trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/**
 * URL do webhook, ou null se a base configurada não formar uma URL válida.
 * Nesse caso a cobrança é criada sem notification_url: o pagamento continua
 * funcionando (a UI confirma pelo polling de /api/mercadopago/status), em vez
 * de falhar inteiro por causa de uma variável mal colada.
 */
function webhookUrlOrNull(): string | null {
  try {
    return new URL("/api/mercadopago/webhook", appUrl()).toString();
  } catch {
    return null;
  }
}

export interface PixPaymentResult {
  paymentId: string;
  status: PaymentStatus;
  rawStatus: string;
  statusDetail?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
}

/**
 * Relê um Pix já criado (id vindo de payment_confirmations, nunca do
 * navegador) para reaproveitar o mesmo QR code quando a pessoa volta à
 * conversa — em vez de gerar uma cobrança nova a cada clique. Retorna null
 * se o pagamento não existe mais ou já saiu de pendente.
 */
export async function getPendingPixPayment(mpPaymentId: string): Promise<PixPaymentResult | null> {
  const res = await fetch(`${MP_API}/v1/payments/${mpPaymentId}`, {
    headers: { Authorization: `Bearer ${platformAccessToken()}` },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const status = mapMercadoPagoStatus(data.status);
  if (status !== "pending" && status !== "processing") return null;

  const tx = data.point_of_interaction?.transaction_data;
  if (typeof tx?.qr_code !== "string") return null;

  return {
    paymentId: String(data.id),
    status,
    rawStatus: String(data.status || ""),
    qrCode: tx.qr_code,
    qrCodeBase64: typeof tx.qr_code_base64 === "string" ? tx.qr_code_base64 : undefined,
    expiresAt: data.date_of_expiration ?? undefined,
  };
}

/**
 * Cria um pagamento Pix direto (checkout transparente): o QR code e o
 * copia-e-cola voltam na resposta e são exibidos na própria conversa — sem
 * formulário do Mercado Pago e sem envio por e-mail. Valor e pedido vêm
 * sempre do servidor; do comprador só usamos a identidade real da conta
 * (e-mail da sessão) e o CPF que ele informa, que o Mercado Pago exige para
 * Pix.
 */
export async function createPixPaymentForBuyer(options: {
  orderId: string;
  amount: number;
  description: string;
  payerEmail: string;
  payerFirstName?: string;
  payerCpf: string;
}): Promise<PixPaymentResult> {
  const cpf = options.payerCpf.replace(/\D/g, "");

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${platformAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${options.orderId}-${Date.now()}`.slice(0, 64),
    },
    body: JSON.stringify({
      transaction_amount: round2(options.amount),
      payment_method_id: "pix",
      external_reference: options.orderId.slice(0, 64),
      description: options.description.slice(0, 256),
      notification_url: webhookUrlOrNull() ?? undefined,
      payer: {
        email: options.payerEmail,
        first_name: options.payerFirstName,
        identification: { type: "CPF", number: cpf },
      },
    }),
  });

  const data = await parseOrThrow(res, "Pagamento recusado pelo Mercado Pago.");
  const tx = data.point_of_interaction?.transaction_data;

  return {
    paymentId: String(data.id),
    status: mapMercadoPagoStatus(data.status),
    rawStatus: String(data.status || ""),
    statusDetail: typeof data.status_detail === "string" ? data.status_detail : undefined,
    qrCode: typeof tx?.qr_code === "string" ? tx.qr_code : undefined,
    qrCodeBase64: typeof tx?.qr_code_base64 === "string" ? tx.qr_code_base64 : undefined,
    expiresAt: data.date_of_expiration ?? undefined,
  };
}

/**
 * Cancela um Pix ainda pendente no Mercado Pago (`status: cancelled`) — o
 * código/QR já entregue ao comprador deixa de poder ser pago. Só funciona
 * enquanto o pagamento está `pending`; a própria API do Mercado Pago recusa
 * cancelar algo já aprovado, o que é a proteção certa: quem chama isso deve
 * SEMPRE checar o status real (fetchMercadoPagoPayment) antes, nunca confiar
 * que o pagamento ainda está pendente só porque nosso banco ainda diz isso.
 */
export async function cancelPixPayment(mpPaymentId: string): Promise<void> {
  const res = await fetch(`${MP_API}/v1/payments/${mpPaymentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${platformAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (typeof err.message === "string" && err.message) || "Falha ao cancelar o Pix no Mercado Pago.",
    );
  }
}

/**
 * Provedor real de pagamentos via Mercado Pago, conta única da plataforma.
 * Só deve ser importado em código de servidor — nunca em um componente de
 * cliente. Ver app/api/mercadopago/checkout/route.ts (validação de
 * produto/criador/valor sempre no servidor, split calculado a partir de
 * lib/security/config.ts e registrado em payment_confirmations).
 */
export class MercadoPagoProvider implements PaymentProvider {
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
        Authorization: `Bearer ${platformAccessToken()}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${input.orderId}-pix`,
      },
      body: JSON.stringify({
        transaction_amount: round2(input.amount),
        description: input.description ?? `Pedido ${input.orderId}`,
        payment_method_id: "pix",
        external_reference: input.orderId,
        notification_url: webhookUrlOrNull() ?? undefined,
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
    const base = appUrl();

    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${platformAccessToken()}`,
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
        payer: input.payerEmail ? { email: input.payerEmail } : undefined,
        payment_methods:
          input.method === "boleto"
            ? { excluded_payment_types: [{ id: "credit_card" }, { id: "debit_card" }] }
            : { excluded_payment_types: [{ id: "ticket" }] },
        back_urls: {
          success: `${base}/checkout/retorno?orderId=${input.orderId}`,
          failure: `${base}/checkout/retorno?orderId=${input.orderId}`,
          pending: `${base}/checkout/retorno?orderId=${input.orderId}`,
        },
        auto_return: "approved",
        notification_url: webhookUrlOrNull() ?? undefined,
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

/** Busca um pagamento pelo id usando o token da própria plataforma — usado
 * pelo webhook para nunca confiar cegamente no payload recebido. */
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
