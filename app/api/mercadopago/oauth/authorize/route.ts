import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { getMercadoPagoAuthorizeUrl, signOAuthState } from "@/lib/payments/mercadoPagoOAuth";

/**
 * Inicia o OAuth do Mercado Pago para a pessoa criadora autenticada.
 * Exige sessão Supabase real — não faz sentido conectar uma conta de
 * pagamento real a um usuário mock.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/entrar", requiredAppUrl()));
  }

  const state = signOAuthState(user.id);
  const authorizeUrl = getMercadoPagoAuthorizeUrl(state);
  return NextResponse.redirect(authorizeUrl);
}

function requiredAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL não configurado.");
  return url;
}
