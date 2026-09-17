import "server-only";
import crypto from "node:crypto";

const MP_AUTH_URL = "https://auth.mercadopago.com/authorization";
const MP_API = "https://api.mercadopago.com";
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutos — janela de CSRF/replay do OAuth.

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} não configurada.`);
  return value;
}

/**
 * Assina um "state" OAuth (profileId + timestamp) com HMAC usando AUTH_SECRET
 * — evita CSRF/replay sem precisar de uma tabela de nonces. Verificado em
 * verifyOAuthState() antes de trocar o code por tokens.
 */
export function signOAuthState(profileId: string): string {
  const payload = `${profileId}.${Date.now()}`;
  const signature = crypto.createHmac("sha256", requiredEnv("AUTH_SECRET")).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyOAuthState(state: string): { profileId: string } | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const [profileId, timestampRaw, signature] = decoded.split(".");
    if (!profileId || !timestampRaw || !signature) return null;

    const payload = `${profileId}.${timestampRaw}`;
    const expected = crypto.createHmac("sha256", requiredEnv("AUTH_SECRET")).update(payload).digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== receivedBuffer.length) return null;
    if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) return null;

    const timestamp = Number(timestampRaw);
    if (!Number.isFinite(timestamp) || Date.now() - timestamp > STATE_TTL_MS) return null;

    return { profileId };
  } catch {
    return null;
  }
}

export function getMercadoPagoAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requiredEnv("MERCADOPAGO_CLIENT_ID"),
    response_type: "code",
    platform_id: "mp",
    redirect_uri: requiredEnv("MERCADOPAGO_REDIRECT_URI"),
    state,
  });
  return `${MP_AUTH_URL}?${params.toString()}`;
}

export interface MercadoPagoOAuthTokens {
  accessToken: string;
  refreshToken: string;
  publicKey: string | null;
  scope: string | null;
  tokenType: string | null;
  liveMode: boolean;
  expiresIn: number;
  mpUserId: string;
}

export async function exchangeMercadoPagoOAuthCode(code: string): Promise<MercadoPagoOAuthTokens> {
  const res = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requiredEnv("MERCADOPAGO_CLIENT_ID"),
      client_secret: requiredEnv("MERCADOPAGO_CLIENT_SECRET"),
      grant_type: "authorization_code",
      code,
      redirect_uri: requiredEnv("MERCADOPAGO_REDIRECT_URI"),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      (typeof err.message === "string" && err.message) ||
      (typeof err.error === "string" && err.error) ||
      "Falha ao trocar o código OAuth por tokens do Mercado Pago.";
    throw new Error(message);
  }

  const data = await res.json();
  return {
    accessToken: String(data.access_token),
    refreshToken: String(data.refresh_token),
    publicKey: typeof data.public_key === "string" ? data.public_key : null,
    scope: typeof data.scope === "string" ? data.scope : null,
    tokenType: typeof data.token_type === "string" ? data.token_type : null,
    liveMode: Boolean(data.live_mode),
    expiresIn: Number(data.expires_in) || 21600,
    mpUserId: String(data.user_id),
  };
}

export async function refreshMercadoPagoOAuthToken(refreshToken: string): Promise<MercadoPagoOAuthTokens> {
  const res = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requiredEnv("MERCADOPAGO_CLIENT_ID"),
      client_secret: requiredEnv("MERCADOPAGO_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      (typeof err.message === "string" && err.message) || "Falha ao renovar o token do Mercado Pago.";
    throw new Error(message);
  }

  const data = await res.json();
  return {
    accessToken: String(data.access_token),
    refreshToken: String(data.refresh_token),
    publicKey: typeof data.public_key === "string" ? data.public_key : null,
    scope: typeof data.scope === "string" ? data.scope : null,
    tokenType: typeof data.token_type === "string" ? data.token_type : null,
    liveMode: Boolean(data.live_mode),
    expiresIn: Number(data.expires_in) || 21600,
    mpUserId: String(data.user_id),
  };
}

export async function fetchMercadoPagoUserNickname(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${MP_API}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.nickname === "string" ? data.nickname : null;
  } catch {
    return null;
  }
}
