import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { fetchMercadoPagoPayment, mapMercadoPagoStatus } from "@/lib/payments/MercadoPagoMarketplaceProvider";
import { confirmPaymentFromWebhook } from "@/lib/payments/paymentConfirmations";

/**
 * Recebe as notificações (webhook) do Mercado Pago.
 *
 * Nunca confia no corpo da notificação: usa apenas o id do pagamento
 * recebido para buscar o registro real na API do Mercado Pago (com o token
 * da própria integradora, que enxerga qualquer pagamento criado dentro do
 * seu ecossistema OAuth), e só então grava o status/valor confirmados em
 * payment_confirmations — a autoridade real usada por toda a aplicação.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret && !isSignatureValid(request, rawBody, secret)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const payload = safeParse(rawBody);
  const type = payload?.type ?? payload?.topic;
  const mpPaymentId = payload?.data?.id;

  if (type !== "payment" || !mpPaymentId) {
    // Outros tipos de notificação (merchant_order etc.) não são relevantes
    // para a confirmação de pagamento — reconhecemos sem processar.
    return NextResponse.json({ received: true });
  }

  try {
    const payment = await fetchMercadoPagoPayment(String(mpPaymentId));
    if (!payment || !payment.externalReference) {
      console.error(`[mercadopago/webhook] pagamento ${mpPaymentId} não encontrado ou sem external_reference.`);
      return NextResponse.json({ received: true });
    }

    await confirmPaymentFromWebhook({
      orderId: payment.externalReference,
      mpPaymentId: payment.id,
      status: mapMercadoPagoStatus(payment.status),
      rawStatus: payment.status,
    });
  } catch (error) {
    console.error("[mercadopago/webhook]", error);
    // Mesmo em erro, respondemos 2xx: o Mercado Pago reenvia notificações
    // que não retornam 2xx, e o próximo reenvio reprocessa do zero.
  }

  return NextResponse.json({ received: true });
}

function safeParse(rawBody: string): { type?: string; topic?: string; data?: { id?: string } } | null {
  try {
    return rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return null;
  }
}

function isSignatureValid(request: Request, rawBody: string, secret: string): boolean {
  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const dataId = new URL(request.url).searchParams.get("data.id") ?? extractDataId(rawBody);
  const manifest = `id:${dataId ?? ""};request-id:${requestId};ts:${ts};`;
  const expectedHash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const expectedBuffer = Buffer.from(expectedHash);
  const receivedBuffer = Buffer.from(hash);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function extractDataId(rawBody: string): string | undefined {
  try {
    const parsed = JSON.parse(rawBody) as { data?: { id?: string } };
    return parsed.data?.id;
  } catch {
    return undefined;
  }
}
