import { NextResponse } from "next/server";
import { getServerPaymentProvider } from "@/lib/payments/getServerPaymentProvider";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId é obrigatório." }, { status: 400 });
  }

  try {
    const provider = getServerPaymentProvider();
    const status = await provider.getPaymentStatus(paymentId);
    return NextResponse.json({ status });
  } catch (error) {
    console.error("[mercadopago/status]", error);
    return NextResponse.json(
      { error: "Não foi possível consultar o status do pagamento." },
      { status: 502 },
    );
  }
}
