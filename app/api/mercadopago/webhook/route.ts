import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getServerPaymentProvider } from "@/lib/payments/getServerPaymentProvider";

/**
 * Recebe as notificações (IPN/webhook) do Mercado Pago.
 *
 * Este protótipo não tem persistência real no servidor (pedidos/pagamentos
 * vivem no mock-session do navegador), então este endpoint apenas valida a
 * assinatura e confirma a notificação junto à API do Mercado Pago — a
 * confirmação efetiva do fluxo acontece por polling client-side em
 * /api/mercadopago/status (ver MercadoPagoPixPanel e a página de retorno do
 * checkout). Em produção, é aqui que o status seria persistido no banco.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret && !isSignatureValid(request, rawBody, secret)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const payload: unknown = rawBody ? JSON.parse(rawBody) : null;

  try {
    const provider = getServerPaymentProvider();
    await provider.handleWebhook(payload);
  } catch (error) {
    console.error("[mercadopago/webhook]", error);
    // Mesmo em erro, respondemos 200: o Mercado Pago reenvia notificações
    // que não retornam 2xx, e sem persistência não há nada a reprocessar.
  }

  return NextResponse.json({ received: true });
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
