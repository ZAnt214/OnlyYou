import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { createBrickPreference, getMercadoPagoPublicKey } from "@/lib/payments/MercadoPagoProvider";
import { resolveCustomServiceOrderForBuyer } from "@/lib/payments/resolveCustomServiceOrder";

/**
 * Prepara o Payment Brick (formulário oficial do Mercado Pago embutido na
 * conversa): cria a preference no servidor e devolve o id dela junto da
 * chave pública. Nenhum pagamento é criado aqui — isso só acontece quando a
 * pessoa preenche o formulário e o Brick envia os dados para
 * /api/mercadopago/process-payment.
 */
export async function POST(request: Request) {
  const buyer = await getCurrentUser();
  if (!buyer) {
    return NextResponse.json({ error: "É necessário estar autenticado para pagar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const orderId = (body as { orderId?: unknown } | null)?.orderId;
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "orderId é obrigatório." }, { status: 400 });
  }

  const publicKey = getMercadoPagoPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: "Pagamento indisponível: chave pública do Mercado Pago não configurada." },
      { status: 503 },
    );
  }

  const order = await resolveCustomServiceOrderForBuyer(orderId, buyer.id);
  if (!order) {
    return NextResponse.json({ error: "Pedido personalizado não encontrado." }, { status: 404 });
  }

  try {
    const { preferenceId } = await createBrickPreference({
      orderId: order.orderId,
      amount: order.amountCents / 100,
      description: order.description,
    });

    return NextResponse.json({
      preferenceId,
      publicKey,
      amount: order.amountCents / 100,
      description: order.description,
    });
  } catch (error) {
    console.error("[mercadopago/brick-session]", error);
    return NextResponse.json({ error: "Não foi possível preparar o pagamento." }, { status: 502 });
  }
}
