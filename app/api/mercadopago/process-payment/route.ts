import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { createPaymentFromBrick } from "@/lib/payments/MercadoPagoProvider";
import { resolveCustomServiceOrderForBuyer } from "@/lib/payments/resolveCustomServiceOrder";
import { createPendingConfirmation } from "@/lib/payments/paymentConfirmations";
import { activateCustomServiceOrderAfterPayment } from "@/lib/payments/activateCustomServiceOrder";
import { isPaidStatus } from "@/lib/payments/PaymentProvider";
import { platformConfig } from "@/lib/security/config";

/**
 * Recebe o formData do Payment Brick e cria a cobrança de verdade. O valor e
 * o criador nunca vêm do cliente: são resolvidos aqui a partir de
 * custom_service_orders (RLS + checagem de requester_id). Do formData só
 * aproveitamos o que é legitimamente do pagador — meio de pagamento e dados
 * pessoais que o próprio Mercado Pago coletou no formulário.
 */
export async function POST(request: Request) {
  const buyer = await getCurrentUser();
  if (!buyer) {
    return NextResponse.json({ error: "É necessário estar autenticado para pagar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = body as { orderId?: unknown; formData?: unknown } | null;
  if (typeof parsed?.orderId !== "string" || !parsed.orderId) {
    return NextResponse.json({ error: "orderId é obrigatório." }, { status: 400 });
  }
  if (!parsed.formData || typeof parsed.formData !== "object") {
    return NextResponse.json({ error: "Dados de pagamento incompletos." }, { status: 400 });
  }

  const order = await resolveCustomServiceOrderForBuyer(parsed.orderId, buyer.id);
  if (!order) {
    return NextResponse.json({ error: "Pedido personalizado não encontrado." }, { status: 404 });
  }

  const grossAmountCents = order.amountCents;
  const platformFeeCents = Math.round(grossAmountCents * platformConfig.platformRevenueShare);
  const creatorAmountCents = grossAmountCents - platformFeeCents;

  try {
    const payment = await createPaymentFromBrick(parsed.formData as Record<string, unknown>, {
      orderId: order.orderId,
      amount: grossAmountCents / 100,
      description: order.description,
    });

    await createPendingConfirmation({
      orderId: order.orderId,
      mpPaymentId: payment.paymentId,
      buyerId: buyer.id,
      creatorId: order.creatorId,
      grossAmountCents,
      platformFeeCents,
      creatorAmountCents,
      currency: "BRL",
      method: typeof (parsed.formData as Record<string, unknown>).payment_method_id === "string"
        ? String((parsed.formData as Record<string, unknown>).payment_method_id)
        : "unknown",
      kind: "custom_service",
      status: payment.status,
    });

    // Cartão aprovado na hora já libera o pedido; Pix nasce pendente e é
    // liberado pelo webhook/polling quando o pagamento cair.
    if (isPaidStatus(payment.status)) {
      await activateCustomServiceOrderAfterPayment(order.orderId);
    }

    return NextResponse.json({
      status: payment.status,
      paymentId: payment.paymentId,
      statusDetail: payment.statusDetail,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      expiresAt: payment.expiresAt,
    });
  } catch (error) {
    console.error("[mercadopago/process-payment]", error);
    const message = error instanceof Error ? error.message : "Não foi possível processar o pagamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
