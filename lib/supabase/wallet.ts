import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreatorBalance, PixKeyType, Withdrawal, WithdrawalStatus } from "@/lib/types";

/**
 * Carteira/saque real (Supabase): todo pagamento cai na conta única do
 * Jobê no Mercado Pago (ver lib/payments/MercadoPagoProvider.ts) — o
 * repasse ao criador não passa por nenhuma integração bancária automática.
 * O saldo disponível é calculado a partir de payment_confirmations (pagos)
 * menos saques já solicitados/concluídos (função request_withdrawal, que
 * também valida isso no banco — nunca confiar só na leitura daqui para
 * decidir se um saque pode ser criado). Saque em si é sempre feito à mão
 * por um admin em /admin/saques (transferência manual fora da plataforma),
 * marcado como concluído via review_withdrawal.
 */

interface WithdrawalRow {
  id: string;
  creator_id: string;
  amount_cents: number;
  pix_key_type: PixKeyType;
  pix_key: string;
  status: WithdrawalStatus;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by?: string | null;
  admin_notes?: string | null;
}

function mapWithdrawal(row: WithdrawalRow): Withdrawal {
  return {
    id: row.id,
    creatorId: row.creator_id,
    amountCents: row.amount_cents,
    currency: "BRL",
    pixKeyType: row.pix_key_type,
    pixKey: row.pix_key,
    status: row.status,
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by ?? null,
    adminNotes: row.admin_notes ?? null,
  };
}

export async function getCreatorBalance(
  supabase: SupabaseClient,
  creatorId: string,
): Promise<CreatorBalance> {
  const [{ data: paidPayments, error: paymentsError }, { data: withdrawals, error: withdrawalsError }] =
    await Promise.all([
      supabase
        .from("payment_confirmations")
        .select("creator_amount_cents")
        .eq("creator_id", creatorId)
        .eq("status", "paid"),
      supabase.from("withdrawals").select("amount_cents, status").eq("creator_id", creatorId),
    ]);

  if (paymentsError) throw new Error(paymentsError.message);
  if (withdrawalsError) throw new Error(withdrawalsError.message);

  const earnedCents = (paidPayments ?? []).reduce((sum, p) => sum + p.creator_amount_cents, 0);
  const reservedCents = (withdrawals ?? [])
    .filter((w) => w.status === "requested" || w.status === "paid")
    .reduce((sum, w) => sum + w.amount_cents, 0);
  const withdrawnCents = (withdrawals ?? [])
    .filter((w) => w.status === "paid")
    .reduce((sum, w) => sum + w.amount_cents, 0);

  return {
    creatorId,
    earnedCents,
    availableCents: Math.max(0, earnedCents - reservedCents),
    withdrawnCents,
    currency: "BRL",
  };
}

export async function listWithdrawalsForCreator(
  supabase: SupabaseClient,
  creatorId: string,
): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from("withdrawals")
    .select("id, creator_id, amount_cents, pix_key_type, pix_key, status, requested_at, reviewed_at")
    .eq("creator_id", creatorId)
    .order("requested_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapWithdrawal);
}

export async function requestWithdrawal(
  supabase: SupabaseClient,
  input: { amountCents: number; pixKeyType: PixKeyType; pixKey: string },
): Promise<Withdrawal> {
  const { data, error } = await supabase
    .rpc("request_withdrawal", {
      p_amount_cents: input.amountCents,
      p_pix_key_type: input.pixKeyType,
      p_pix_key: input.pixKey,
    })
    .single();
  if (error) throw new Error(error.message);
  return mapWithdrawal(data as WithdrawalRow);
}

export interface AdminWithdrawalRow extends Withdrawal {
  creatorUsername: string | null;
  creatorDisplayName: string | null;
}

export async function listAllWithdrawalsForAdmin(supabase: SupabaseClient): Promise<AdminWithdrawalRow[]> {
  const { data, error } = await supabase
    .from("withdrawals")
    .select("*, creator:profiles!withdrawals_creator_id_fkey(username, display_name)")
    .order("requested_at", { ascending: false });
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as Array<
    WithdrawalRow & { creator: { username: string | null; display_name: string | null } | null }
  >).map((row) => ({
    ...mapWithdrawal(row),
    creatorUsername: row.creator?.username ?? null,
    creatorDisplayName: row.creator?.display_name ?? null,
  }));
}

export async function reviewWithdrawal(
  supabase: SupabaseClient,
  input: { withdrawalId: string; status: "paid" | "rejected"; adminNotes?: string },
): Promise<Withdrawal> {
  const { data, error } = await supabase
    .rpc("review_withdrawal", {
      p_withdrawal_id: input.withdrawalId,
      p_status: input.status,
      p_admin_notes: input.adminNotes ?? null,
    })
    .single();
  if (error) throw new Error(error.message);
  return mapWithdrawal(data as WithdrawalRow);
}
