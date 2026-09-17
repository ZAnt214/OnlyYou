import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface AdminPaymentConfirmationRow {
  orderId: string;
  mpPaymentId: string;
  status: string;
  kind: string;
  method: string | null;
  grossAmountCents: number;
  platformFeeCents: number;
  creatorAmountCents: number;
  currency: string;
  buyerUsername: string | null;
  creatorUsername: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

/**
 * Listagem para /admin/pagamentos — usa o service role (a única forma de
 * enxergar todos os pagamentos, já que a RLS de payment_confirmations
 * restringe cada linha ao próprio comprador/criador). Só deve ser chamada
 * depois de requireAdmin(). Nunca expõe tokens — esta tabela não os tem.
 */
export async function listPaymentConfirmationsForAdmin(limit = 100): Promise<AdminPaymentConfirmationRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("payment_confirmations")
    .select(
      `order_id, mp_payment_id, status, kind, method, gross_amount_cents, platform_fee_cents,
       creator_amount_cents, currency, created_at, confirmed_at,
       buyer:profiles!payment_confirmations_buyer_id_fkey(username),
       creator:profiles!payment_confirmations_creator_id_fkey(username)`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao listar pagamentos: ${error.message}`);

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    orderId: row.order_id,
    mpPaymentId: row.mp_payment_id,
    status: row.status,
    kind: row.kind,
    method: row.method,
    grossAmountCents: row.gross_amount_cents,
    platformFeeCents: row.platform_fee_cents,
    creatorAmountCents: row.creator_amount_cents,
    currency: row.currency,
    buyerUsername: singleRelation(row.buyer)?.username ?? null,
    creatorUsername: singleRelation(row.creator)?.username ?? null,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
  }));
}

interface ProfileUsername {
  username: string | null;
}

interface RawRow {
  order_id: string;
  mp_payment_id: string;
  status: string;
  kind: string;
  method: string | null;
  gross_amount_cents: number;
  platform_fee_cents: number;
  creator_amount_cents: number;
  currency: string;
  created_at: string;
  confirmed_at: string | null;
  buyer: ProfileUsername | ProfileUsername[] | null;
  creator: ProfileUsername | ProfileUsername[] | null;
}

function singleRelation(value: ProfileUsername | ProfileUsername[] | null): ProfileUsername | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
