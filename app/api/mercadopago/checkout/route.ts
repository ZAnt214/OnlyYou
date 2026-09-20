import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServerPaymentProvider } from "@/lib/payments/getServerPaymentProvider";
import { createPendingConfirmation } from "@/lib/payments/paymentConfirmations";
import { getProductOrderById } from "@/lib/supabase/products";
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
 * saque manual, ver lib/supabase/wallet.ts). O pedido (product_orders) já
 * precisa existir — criado antes pela RPC create_product_order, que trava
 * o preço no momento da compra — este endpoint só confere que o pedido é
 * do próprio comprador, está aguardando pagamento e bate com o produto
 * informado; nunca recalcula valor a partir do produto "ao vivo".
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

  const supabase = await createServerClient();
  const order = await getProductOrderById(supabase, body.orderId);
  if (!order || order.buyerId !== buyer.id || order.productId !== body.productId) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.status !== "awaiting_payment") {
    return NextResponse.json({ error: "Este pedido não está aguardando pagamento." }, { status: 409 });
  }

  const { data: productRow } = await supabase.from("products").select("title").eq("id", order.productId).maybeSingle();
  const creatorId = order.creatorId;
  const description = productRow?.title ?? "Produto";

  const grossAmountCents = order.unitPriceCents;
  const platformFeeCents = Math.round(grossAmountCents * platformConfig.platformRevenueShare);
  const creatorAmountCents = grossAmountCents - platformFeeCents;

  try {
    const provider = getServerPaymentProvider();
    const result = await provider.createCheckout({
      orderId: body.orderId,
      amount: grossAmountCents / 100,
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
