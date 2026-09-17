import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { exchangeMercadoPagoOAuthCode, verifyOAuthState } from "@/lib/payments/mercadoPagoOAuth";
import { saveCreatorMercadoPagoConnection } from "@/lib/payments/creatorMercadoPagoAccount";

const RETURN_PATH = "/dashboard/pagamentos";

export async function GET(request: Request) {
  const appUrl = requiredAppUrl();
  const { searchParams } = new URL(request.url);

  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`${RETURN_PATH}?mp_oauth=error`, appUrl));
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL(`${RETURN_PATH}?mp_oauth=error`, appUrl));
  }

  const verified = verifyOAuthState(state);
  if (!verified) {
    return NextResponse.redirect(new URL(`${RETURN_PATH}?mp_oauth=error`, appUrl));
  }

  // O state só prova que este navegador iniciou o fluxo para este
  // profileId — confirmamos também que é a mesma pessoa autenticada agora
  // (nunca confiar só no state contra troca de sessão no meio do fluxo).
  const user = await getCurrentUser();
  if (!user || user.id !== verified.profileId) {
    return NextResponse.redirect(new URL(`${RETURN_PATH}?mp_oauth=error`, appUrl));
  }

  try {
    const tokens = await exchangeMercadoPagoOAuthCode(code);
    await saveCreatorMercadoPagoConnection(user.id, tokens);
  } catch (err) {
    console.error("[mercadopago/oauth/callback]", err);
    return NextResponse.redirect(new URL(`${RETURN_PATH}?mp_oauth=error`, appUrl));
  }

  return NextResponse.redirect(new URL(`${RETURN_PATH}?mp_oauth=success`, appUrl));
}

function requiredAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL não configurado.");
  return url;
}
