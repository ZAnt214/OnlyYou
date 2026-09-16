import { NextResponse } from "next/server";
import { getServerPaymentProvider } from "@/lib/payments/getServerPaymentProvider";
import type { PaymentMethod } from "@/lib/types";

interface CheckoutRequestBody {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  description?: string;
  payerEmail?: string;
}

function isValidBody(body: unknown): body is CheckoutRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.orderId === "string" &&
    b.orderId.length > 0 &&
    typeof b.amount === "number" &&
    b.amount > 0 &&
    (b.method === "pix" || b.method === "credit_card" || b.method === "boleto")
  );
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const provider = getServerPaymentProvider();
    const result = await provider.createCheckout(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[mercadopago/checkout]", error);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento no Mercado Pago." },
      { status: 502 },
    );
  }
}
