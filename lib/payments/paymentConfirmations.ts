import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/types";

export interface PendingConfirmationInput {
  orderId: string;
  mpPaymentId: string;
  mpPreferenceId?: string;
  buyerId: string;
  creatorId: string;
  grossAmountCents: number;
  platformFeeCents: number;
  creatorAmountCents: number;
  currency: string;
  method: string;
  kind: "product" | "custom_service";
  status: PaymentStatus;
}

/**
 * Registrado no momento da criação do checkout (sempre no servidor, nunca a
 * partir do retorno do navegador) — é a única forma de o webhook, mais
 * tarde, saber a quem um pagamento pertence e qual split aplicar.
 */
export async function createPendingConfirmation(input: PendingConfirmationInput): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("payment_confirmations").insert({
    order_id: input.orderId,
    mp_payment_id: input.mpPaymentId,
    mp_preference_id: input.mpPreferenceId,
    buyer_id: input.buyerId,
    creator_id: input.creatorId,
    status: input.status,
    gross_amount_cents: input.grossAmountCents,
    platform_fee_cents: input.platformFeeCents,
    creator_amount_cents: input.creatorAmountCents,
    currency: input.currency,
    method: input.method,
    kind: input.kind,
  });
  if (error) throw new Error(`Falha ao registrar pagamento pendente: ${error.message}`);
}

/**
 * Chamado pelo webhook depois de confirmar o pagamento diretamente na API
 * do Mercado Pago (nunca a partir do payload cru). Casa pelo order_id
 * (external_reference) — para Pix o mp_payment_id já nasce correto no
 * momento da criação; para Checkout Pro (cartão/boleto) só é conhecido
 * agora, então é atualizado aqui. Idempotente: reprocessar a mesma
 * notificação só reescreve os mesmos valores, nunca duplica a linha.
 */
export async function confirmPaymentFromWebhook(params: {
  orderId: string;
  mpPaymentId: string;
  status: PaymentStatus;
  rawStatus: string;
}): Promise<{ updated: boolean; kind: "product" | "custom_service" | null }> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("payment_confirmations")
    .select("id, status, kind")
    .eq("order_id", params.orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    // Não há como atribuir criador/comprador/split sem a linha criada no
    // checkout — registrar para investigação manual em vez de adivinhar.
    console.error(
      `[payment_confirmations] webhook para order_id=${params.orderId} sem checkout pendente correspondente.`,
    );
    return { updated: false, kind: null };
  }

  // Pagamento já confirmado antes (reenvio de notificação) — não reprocessa.
  if (existing.status === "paid" && params.status === "paid") {
    return { updated: false, kind: existing.kind };
  }

  const { error } = await supabase
    .from("payment_confirmations")
    .update({
      mp_payment_id: params.mpPaymentId,
      status: params.status,
      raw_status: params.rawStatus,
      confirmed_at: params.status === "paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) throw new Error(`Falha ao confirmar pagamento: ${error.message}`);
  return { updated: true, kind: existing.kind };
}

export interface PaymentConfirmationRow {
  orderId: string;
  mpPaymentId: string;
  status: PaymentStatus;
  grossAmountCents: number;
  platformFeeCents: number;
  creatorAmountCents: number;
  currency: string;
  confirmedAt: string | null;
  kind: "product" | "custom_service";
}

/**
 * Leitura usada pela rota de status (/api/mercadopago/status): passa pelo
 * cliente Supabase normal (RLS), nunca pelo service role — quem chama só
 * enxerga a própria linha (comprador ou criador), automaticamente, via a
 * policy payment_confirmations_select_own.
 */
export async function getConfirmationForViewer(orderId: string): Promise<PaymentConfirmationRow | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("payment_confirmations")
    .select(
      "order_id, mp_payment_id, status, gross_amount_cents, platform_fee_cents, creator_amount_cents, currency, confirmed_at, kind",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    orderId: data.order_id,
    mpPaymentId: data.mp_payment_id,
    status: data.status,
    grossAmountCents: data.gross_amount_cents,
    platformFeeCents: data.platform_fee_cents,
    creatorAmountCents: data.creator_amount_cents,
    currency: data.currency,
    confirmedAt: data.confirmed_at,
    kind: data.kind,
  };
}

/**
 * Reconciliação ativa usada pela rota de status quando o webhook ainda não
 * chegou (comum no retorno do Checkout Pro, que redireciona antes da
 * notificação assíncrona). `status` já deve ter sido confirmado consultando
 * a API do Mercado Pago — nunca chamar isto a partir de dado não verificado.
 */
export async function reconcileConfirmationStatus(
  orderId: string,
  mpPaymentId: string,
  status: PaymentStatus,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("payment_confirmations")
    .update({
      mp_payment_id: mpPaymentId,
      status,
      confirmed_at: status === "paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);
}

/** Marca um pagamento como estornado após confirmação real junto ao Mercado Pago. */
export async function markConfirmationRefunded(orderId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("payment_confirmations")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("order_id", orderId);
}
