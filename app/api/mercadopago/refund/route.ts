import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { getServerPaymentProvider } from "@/lib/payments/getServerPaymentProvider";
import { markConfirmationRefunded } from "@/lib/payments/paymentConfirmations";

/** Só admins podem acionar reembolso — nunca o comprador ou o criador direto. */
export async function POST(request: Request) {
  const realUser = await getCurrentUser();
  if (!realUser?.roles.includes("admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const b = body as { orderId?: unknown; mpPaymentId?: unknown } | null;
  if (typeof b?.orderId !== "string" || typeof b?.mpPaymentId !== "string") {
    return NextResponse.json({ error: "orderId e mpPaymentId são obrigatórios." }, { status: 400 });
  }

  try {
    const provider = getServerPaymentProvider();
    await provider.refund(b.mpPaymentId);
    await markConfirmationRefunded(b.orderId);
    return NextResponse.json({ refunded: true });
  } catch (error) {
    console.error("[mercadopago/refund]", error);
    return NextResponse.json({ error: "Não foi possível estornar o pagamento." }, { status: 502 });
  }
}
