import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createPixPaymentForBuyer, getPendingPixPayment } from "@/lib/payments/MercadoPagoProvider";
import { resolveCustomServiceOrderForBuyer } from "@/lib/payments/resolveCustomServiceOrder";
import { createPendingConfirmation, findPendingConfirmation } from "@/lib/payments/paymentConfirmations";
import { activateCustomServiceOrderAfterPayment } from "@/lib/payments/activateCustomServiceOrder";
import { isPaidStatus } from "@/lib/payments/PaymentProvider";
import { platformConfig } from "@/lib/security/config";

/**
 * Gera o Pix de um pedido personalizado e devolve QR code + copia-e-cola
 * para exibir na própria conversa. O valor e o criador nunca vêm do cliente:
 * são resolvidos aqui a partir de custom_service_orders (RLS + checagem de
 * requester_id). Do comprador só entra o CPF — o e-mail vem da sessão real,
 * não de nada que o navegador informe.
 */
export async function POST(request: Request) {
  const buyer = await getCurrentUser();
  if (!buyer) {
    return NextResponse.json({ error: "É necessário estar autenticado para pagar." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = body as { orderId?: unknown; cpf?: unknown } | null;
  if (typeof parsed?.orderId !== "string" || !parsed.orderId) {
    return NextResponse.json({ error: "orderId é obrigatório." }, { status: 400 });
  }

  const cpfDigits = typeof parsed.cpf === "string" ? parsed.cpf.replace(/\D/g, "") : "";

  const order = await resolveCustomServiceOrderForBuyer(parsed.orderId, buyer.id);
  if (!order) {
    return NextResponse.json({ error: "Pedido personalizado não encontrado." }, { status: 404 });
  }
  if (order.status !== "awaiting_payment") {
    return NextResponse.json({ error: "Este pedido não está aguardando pagamento." }, { status: 409 });
  }
  // O prazo também é checado no banco (create_custom_service_order), mas quem
  // deixa a tela aberta passando do prazo só bate aqui.
  if (order.paymentDueAt && new Date(order.paymentDueAt).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "O prazo para pagar esta proposta expirou. Peça uma nova proposta na conversa." },
      { status: 409 },
    );
  }

  const grossAmountCents = order.amountCents;
  const platformFeeCents = Math.round(grossAmountCents * platformConfig.platformRevenueShare);
  const creatorAmountCents = grossAmountCents - platformFeeCents;

  // Se já existe um Pix pendente para este pedido, devolve o mesmo QR em vez
  // de abrir outra cobrança — clicar de novo (ou reabrir a conversa) não deve
  // gerar um segundo Pix, e nesse caso nem pedimos o CPF de novo.
  const pending = await findPendingConfirmation(order.orderId);
  if (pending) {
    const existing = await getPendingPixPayment(pending.mpPaymentId).catch(() => null);
    if (existing) {
      return NextResponse.json({
        status: existing.status,
        paymentId: existing.paymentId,
        qrCode: existing.qrCode,
        qrCodeBase64: existing.qrCodeBase64,
        expiresAt: existing.expiresAt,
      });
    }
  }

  // Só aqui o CPF passa a ser obrigatório: é um Pix novo. `needsCpf` diz ao
  // painel para mostrar o campo em vez de tratar isso como erro.
  if (cpfDigits.length !== 11) {
    return NextResponse.json(
      { error: "Informe um CPF válido (11 dígitos).", needsCpf: true },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const payerEmail = authData.user?.email;
  if (!payerEmail) {
    return NextResponse.json({ error: "Sua conta não tem e-mail para o pagamento." }, { status: 400 });
  }

  try {
    const payment = await createPixPaymentForBuyer({
      orderId: order.orderId,
      amount: grossAmountCents / 100,
      description: order.description,
      payerEmail,
      payerFirstName: buyer.displayName,
      payerCpf: cpfDigits,
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
      method: "pix",
      kind: "custom_service",
      status: payment.status,
    });

    if (isPaidStatus(payment.status)) {
      await activateCustomServiceOrderAfterPayment(order.orderId);
    }

    return NextResponse.json({
      status: payment.status,
      paymentId: payment.paymentId,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      expiresAt: payment.expiresAt,
    });
  } catch (error) {
    console.error("[mercadopago/process-payment]", error);
    return NextResponse.json({ error: "Não foi possível gerar o Pix." }, { status: 400 });
  }
}
