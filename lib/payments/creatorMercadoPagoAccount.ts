import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  fetchMercadoPagoUserNickname,
  refreshMercadoPagoOAuthToken,
  type MercadoPagoOAuthTokens,
} from "@/lib/payments/mercadoPagoOAuth";

export interface CreatorMercadoPagoStatus {
  connected: boolean;
  status: "not_connected" | "connected" | "error" | "expired";
  mpNickname: string | null;
  liveMode: boolean;
  connectedAt: string | null;
}

/** Leitura pública (RLS permite SELECT para qualquer papel) — sem tokens. */
export async function getCreatorMercadoPagoStatus(profileId: string): Promise<CreatorMercadoPagoStatus> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("creator_mercadopago_status")
    .select("connected, status, mp_nickname, live_mode, connected_at")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!data) {
    return { connected: false, status: "not_connected", mpNickname: null, liveMode: false, connectedAt: null };
  }

  return {
    connected: data.connected,
    status: data.status,
    mpNickname: data.mp_nickname,
    liveMode: data.live_mode,
    connectedAt: data.connected_at,
  };
}

/** Grava a conexão OAuth (tokens + espelho público). Só chamado pela rota de callback. */
export async function saveCreatorMercadoPagoConnection(
  profileId: string,
  tokens: MercadoPagoOAuthTokens,
): Promise<void> {
  const supabase = createServiceClient();
  const nickname = await fetchMercadoPagoUserNickname(tokens.accessToken);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();

  const { error: accountError } = await supabase.from("creator_mercadopago_accounts").upsert({
    profile_id: profileId,
    mp_user_id: tokens.mpUserId,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    public_key: tokens.publicKey,
    scope: tokens.scope,
    token_type: tokens.tokenType,
    live_mode: tokens.liveMode,
    expires_at: expiresAt,
    updated_at: now,
  });
  if (accountError) throw new Error(`Falha ao salvar conexão Mercado Pago: ${accountError.message}`);

  const { error: statusError } = await supabase.from("creator_mercadopago_status").upsert({
    profile_id: profileId,
    connected: true,
    mp_nickname: nickname,
    live_mode: tokens.liveMode,
    connected_at: now,
    status: "connected",
    updated_at: now,
  });
  if (statusError) throw new Error(`Falha ao salvar status Mercado Pago: ${statusError.message}`);
}

export async function disconnectCreatorMercadoPago(profileId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("creator_mercadopago_accounts").delete().eq("profile_id", profileId);
  await supabase.from("creator_mercadopago_status").upsert({
    profile_id: profileId,
    connected: false,
    mp_nickname: null,
    live_mode: false,
    connected_at: null,
    status: "not_connected",
    updated_at: new Date().toISOString(),
  });
}

/**
 * Retorna um access_token válido do criador para criar checkouts em nome
 * dele (marketplace). Renova automaticamente se estiver perto de expirar.
 * Retorna null se o criador nunca conectou a conta — quem chama deve tratar
 * isso como "produto não pode ser vendido ainda".
 */
export async function getValidCreatorAccessToken(profileId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("creator_mercadopago_accounts")
    .select("access_token, refresh_token, expires_at")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!data) return null;

  const expiresAt = new Date(data.expires_at).getTime();
  const isExpiringSoon = expiresAt - Date.now() < 5 * 60 * 1000; // margem de 5 min
  if (!isExpiringSoon) return data.access_token;

  try {
    const refreshed = await refreshMercadoPagoOAuthToken(data.refresh_token);
    await saveCreatorMercadoPagoConnection(profileId, refreshed);
    return refreshed.accessToken;
  } catch {
    await supabase
      .from("creator_mercadopago_status")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("profile_id", profileId);
    return null;
  }
}
