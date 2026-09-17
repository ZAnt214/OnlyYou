import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { disconnectCreatorMercadoPago } from "@/lib/payments/creatorMercadoPagoAccount";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  await disconnectCreatorMercadoPago(user.id);
  return NextResponse.json({ disconnected: true });
}
