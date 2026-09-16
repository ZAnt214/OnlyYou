import { NextResponse } from "next/server";
import { getServerPaymentProvider } from "@/lib/payments/getServerPaymentProvider";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const paymentId = (body as { paymentId?: unknown } | null)?.paymentId;
  if (typeof paymentId !== "string" || !paymentId) {
    return NextResponse.json({ error: "paymentId é obrigatório." }, { status: 400 });
  }

  try {
    const provider = getServerPaymentProvider();
    await provider.refund(paymentId);
    return NextResponse.json({ refunded: true });
  } catch (error) {
    console.error("[mercadopago/refund]", error);
    return NextResponse.json({ error: "Não foi possível estornar o pagamento." }, { status: 502 });
  }
}
