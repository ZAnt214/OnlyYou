import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { getServerPaymentProvider } from "@/lib/payments/getServerPaymentProvider";
import { getValidCreatorAccessToken } from "@/lib/payments/creatorMercadoPagoAccount";
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

interface CustomServiceCheckoutBody {
  orderId: string;
  method: PaymentMethod;
  kind: "custom_service";
  creatorId: string;
  amount: number;
  description: string;
}

type CheckoutBody = ProductCheckoutBody | CustomServiceCheckoutBody;

function isValidBody(body: unknown): body is CheckoutBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.orderId !== "string" || !b.orderId) return false;
  if (b.method !== "pix" && b.method !== "credit_card" && b.method !== "boleto") return false;
  if (b.kind === "product") return typeof b.productId === "string" && !!b.productId;
  if (b.kind === "custom_service") {
    return (
      typeof b.creatorId === "string" &&
      !!b.creatorId &&
      typeof b.amount === "number" &&
      b.amount > 0 &&
      typeof b.description === "string"
    );
  }
  return false;
}

/**
 * Cria um checkout Mercado Pago no modelo de marketplace. O valor e o
 * criador NUNCA vêm confiados do cliente para produtos do catálogo — são
 * resolvidos aqui a partir de productRepository (server-side). Para pedidos
 * personalizados (kind "custom_service") isso ainda não é possível: a
 * CustomProposal aceita vive apenas no mock-session do navegador (não há
 * backend real para propostas nesta fase), então o valor/criador chegam do
 * cliente — mesma limitação que o resto do fluxo de pedidos personalizados
 * já tinha antes desta mudança (não é uma regressão introduzida aqui).
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

  let amount: number;
  let creatorId: string;
  let description: string;

  if (body.kind === "product") {
    const product = await productRepository.findById(body.productId);
    if (!product || product.status !== "approved") {
      return NextResponse.json({ error: "Produto não encontrado ou indisponível." }, { status: 404 });
    }
    amount = product.promoPrice ?? product.price;
    creatorId = product.creatorId;
    description = product.title;
  } else {
    amount = body.amount;
    creatorId = body.creatorId;
    description = body.description;
  }

  const sellerAccessToken = await getValidCreatorAccessToken(creatorId);
  if (!sellerAccessToken) {
    return NextResponse.json(
      { error: "Este criador ainda não conectou uma conta do Mercado Pago." },
      { status: 409 },
    );
  }

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
      sellerAccessToken,
      marketplaceFeeAmount: platformFeeCents / 100,
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
