import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { getServerPaymentProvider } from "@/lib/payments/getServerPaymentProvider";
import { createPendingConfirmation } from "@/lib/payments/paymentConfirmations";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { platformConfig } from "@/lib/security/config";
import type { PaymentMethod } from "@/lib/types";

interface ProductCheckoutBody {
  orderId: string;
  method: PaymentMethod;
  kind: "product";
  productId: string;
}

function isValidBody(body: unknown): body is ProductCheckoutBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.orderId !== "string" || !b.orderId) return false;
  if (b.method !== "pix" && b.method !== "credit_card" && b.method !== "boleto") return false;
  return b.kind === "product" && typeof b.productId === "string" && !!b.productId;
}

/**
 * Checkout de PRODUTO do catálogo (conta única da plataforma — todo
 * pagamento cai na conta do Jobê; o repasse ao criador é saldo em carteira +
 * saque manual, ver lib/supabase/wallet.ts). Valor e criador são sempre
 * resolvidos no servidor a partir de productRepository, nunca vindos do
 * cliente.
 *
 * Pedido personalizado NÃO passa por aqui: usa o Payment Brick
 * (/api/mercadopago/brick-session + /api/mercadopago/process-payment), que é
 * o formulário oficial do Mercado Pago e coleta os dados reais do pagador —
 * sem isso o Mercado Pago recusa o Pix em conta de produção.
 */
export async function POST(request: Request) {
  const buyer = await getCurrentUser();
  if (!buyer) {
    return NextResponse.json(
      { error: "É necessário estar autenticado (conta real) para pagar." },
      { status: 401 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const product = await productRepository.findById(body.productId);
  if (!product || product.status !== "approved") {
    return NextResponse.json({ error: "Produto não encontrado ou indisponível." }, { status: 404 });
  }
  const amount = product.promoPrice ?? product.price;
  const creatorId = product.creatorId;
  const description = product.title;

  const grossAmountCents = Math.round(amount * 100);
  const platformFeeCents = Math.round(grossAmountCents * platformConfig.platformRevenueShare);
  const creatorAmountCents = grossAmountCents - platformFeeCents;

  try {
    const provider = getServerPaymentProvider();
    const result = await provider.createCheckout({
      orderId: body.orderId,
      amount,
      method: body.method,
      description,
    });

    await createPendingConfirmation({
      orderId: body.orderId,
      mpPaymentId: result.paymentId,
      buyerId: buyer.id,
      creatorId,
      grossAmountCents,
      platformFeeCents,
      creatorAmountCents,
      currency: "BRL",
      method: body.method,
      kind: body.kind,
      status: result.status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[mercadopago/checkout]", error);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento no Mercado Pago." },
      { status: 502 },
    );
  }
}
