import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import {
  getConfirmationForViewer,
  reconcileConfirmationStatus,
} from "@/lib/payments/paymentConfirmations";
import { getServerPaymentProvider } from "@/lib/payments/getServerPaymentProvider";
import { isPaidStatus } from "@/lib/payments/PaymentProvider";
import { activateCustomServiceOrderAfterPayment } from "@/lib/payments/activateCustomServiceOrder";
import type { PaymentStatus } from "@/lib/types";

/**
 * Única fonte de verdade de status que o cliente pode consultar. Lê
 * payment_confirmations através do cliente Supabase normal (RLS restringe a
 * linha ao próprio comprador ou criador) — nunca confia em nada que o
 * navegador diga sobre o próprio pagamento.
 *
 * Se ainda não há confirmação definitiva e a chamada vier com mpPaymentId
 * (caso do retorno do Checkout Pro, que traz payment_id na URL antes do
 * webhook chegar), consulta a API do Mercado Pago diretamente para não
 * deixar a UI presa em "pending" esperando o webhook.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const mpPaymentIdHint = searchParams.get("mpPaymentId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId é obrigatório." }, { status: 400 });
  }

  let confirmation = await getConfirmationForViewer(orderId);
  const isTerminal = confirmation && confirmation.status !== "pending" && confirmation.status !== "processing";

  if (!isTerminal && mpPaymentIdHint) {
    try {
      const provider = getServerPaymentProvider();
      const status: PaymentStatus = await provider.getPaymentStatus(mpPaymentIdHint);
      await reconcileConfirmationStatus(orderId, mpPaymentIdHint, status);
      confirmation = await getConfirmationForViewer(orderId);
      if (confirmation?.kind === "custom_service" && isPaidStatus(status)) {
        await activateCustomServiceOrderAfterPayment(orderId);
      }
    } catch (error) {
      console.error("[mercadopago/status] reconciliação ativa falhou", error);
    }
  }

  if (!confirmation) {
    return NextResponse.json({ status: "pending" });
  }

  return NextResponse.json({
    status: confirmation.status,
    paid: isPaidStatus(confirmation.status),
    confirmedAt: confirmation.confirmedAt,
    grossAmountCents: confirmation.grossAmountCents,
    platformFeeCents: confirmation.platformFeeCents,
    creatorAmountCents: confirmation.creatorAmountCents,
  });
}
