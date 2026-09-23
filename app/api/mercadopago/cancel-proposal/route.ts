import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { fetchMercadoPagoPayment, cancelPixPayment, mapMercadoPagoStatus } from "@/lib/payments/MercadoPagoProvider";
import { reconcileConfirmationStatus } from "@/lib/payments/paymentConfirmations";
import { activateCustomServiceOrderAfterPayment } from "@/lib/payments/activateCustomServiceOrder";
import { isPaidStatus } from "@/lib/payments/PaymentProvider";

/**
 * Cancela uma proposta pelo criador — mas antes de mexer no banco, cuida do
 * caso real de dinheiro: se já existe um Pix pendente para o pedido, ele é
 * uma cobrança de verdade no Mercado Pago, viva independente do que a nossa
 * UI mostra. Só ocultar o QR na tela não impede o comprador de pagar um
 * código que ele já copiou.
 *
 * Fluxo:
 * 1. Se há um pagamento pendente registrado, confere o status REAL no
 *    Mercado Pago (nunca confia no nosso cache) — cobre a corrida em que o
 *    comprador paga no exato momento em que o criador cancela.
 * 2. Se já foi aprovado: recusa o cancelamento e reconcilia o pedido como
 *    pago — o dinheiro entrou, o serviço segue.
 * 3. Se ainda está pendente: cancela o Pix no Mercado Pago (invalida o
 *    código) antes de cancelar a proposta no banco — nessa ordem, nunca ao
 *    contrário, para nunca ficar com uma proposta cancelada e um Pix ainda
 *    pagável.
 */
export async function POST(request: Request) {
  const creator = await getCurrentUser();
  if (!creator) {
    return NextResponse.json({ error: "É necessário estar autenticado." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const proposalId = (body as { proposalId?: unknown } | null)?.proposalId;
  if (typeof proposalId !== "string" || !proposalId) {
    return NextResponse.json({ error: "proposalId é obrigatório." }, { status: 400 });
  }

  const supabase = await createServerClient();

  const { data: order } = await supabase
    .from("custom_service_orders")
    .select("order_id, status")
    .eq("proposal_id", proposalId)
    .maybeSingle();

  if (order) {
    const { data: confirmation } = await supabase
      .from("payment_confirmations")
      .select("mp_payment_id, status")
      .eq("order_id", order.order_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (confirmation && (confirmation.status === "pending" || confirmation.status === "processing")) {
      const real = await fetchMercadoPagoPayment(confirmation.mp_payment_id);
      const realStatus = real ? mapMercadoPagoStatus(real.status) : null;

      if (realStatus && isPaidStatus(realStatus)) {
        // Corrida: o pagamento caiu antes do cancelamento processar.
        // O dinheiro já entrou — o pedido segue, não cancela.
        await reconcileConfirmationStatus(order.order_id, confirmation.mp_payment_id, realStatus);
        await activateCustomServiceOrderAfterPayment(order.order_id);
        return NextResponse.json(
          {
            error:
              "O pagamento foi confirmado no momento em que você cancelava. O pedido já está em andamento e não pode mais ser cancelado por aqui.",
          },
          { status: 409 },
        );
      }

      try {
        await cancelPixPayment(confirmation.mp_payment_id);
      } catch (error) {
        console.error("[mercadopago/cancel-proposal] falha ao cancelar Pix", error);
        return NextResponse.json(
          { error: "Não foi possível cancelar o Pix pendente. Tente novamente em instantes." },
          { status: 502 },
        );
      }
      await reconcileConfirmationStatus(order.order_id, confirmation.mp_payment_id, "failed");
    }
  }

  const { data, error } = await supabase.rpc("cancel_custom_proposal", { p_proposal_id: proposalId });
  if (error) {
    console.error("[mercadopago/cancel-proposal] falha ao cancelar proposta", error.code);
    return NextResponse.json({ error: "Não foi possível cancelar a proposta." }, { status: 400 });
  }
  return NextResponse.json({ proposal: data });
}
