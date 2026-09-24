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
  const { data, error } = await supabase.rpc("get_my_creator_payout_summary").single();
  if (error) throw new Error(error.message);

  const row = data as {
    earned_cents: number | string;
    eligible_cents: number | string;
    pending_release_cents: number | string;
    reserved_cents: number | string;
    withdrawn_cents: number | string;
    available_cents: number | string;
  };

  return {
    creatorId,
    earnedCents: Number(row.earned_cents),
    eligibleCents: Number(row.eligible_cents),
    pendingReleaseCents: Number(row.pending_release_cents),
    reservedCents: Number(row.reserved_cents),
    availableCents: Math.max(0, Number(row.available_cents)),
    withdrawnCents: Number(row.withdrawn_cents),
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
  input: { amountCents: number },
): Promise<Withdrawal> {
  const { data, error } = await supabase
    .rpc("request_withdrawal_v2", {
      p_amount_cents: input.amountCents,
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


export interface AdminWithdrawalRecentSale {
  kind: string;
  status: string;
  gross_amount_cents: number;
  creator_amount_cents: number;
  method: string | null;
  buyer_name: string;
  confirmed_at: string;
  service_status: string | null;
}

export interface AdminWithdrawalRecentHistory {
  id: string;
  amount_cents: number;
  pix_key_type: PixKeyType;
  pix_key: string;
  status: WithdrawalStatus;
  requested_at: string;
  reviewed_at: string | null;
}

export interface AdminWithdrawalRisk {
  withdrawalId: string;
  creatorId: string;
  creatorUsername: string | null;
  creatorDisplayName: string | null;
  verificationStatus: string | null;
  accountCreatedAt: string;
  withdrawalAmountCents: number;
  withdrawalStatus: WithdrawalStatus;
  pixKeyType: PixKeyType;
  pixKey: string;
  requestedAt: string;
  snapshotEarnedCents: number | null;
  snapshotEligibleCents: number | null;
  snapshotPendingReleaseCents: number | null;
  snapshotAvailableBeforeCents: number | null;
  currentEarnedCents: number;
  currentEligibleCents: number;
  currentPendingReleaseCents: number;
  currentReservedCents: number;
  currentWithdrawnCents: number;
  currentAvailableCents: number;
  paidSalesCount: number;
  productSalesCount: number;
  serviceSalesCount: number;
  uniqueBuyersCount: number;
  completedServicesCount: number;
  openServiceOrdersCount: number;
  openDisputesCount: number;
  totalDisputesCount: number;
  problemPaymentsCount: number;
  rejectedWithdrawalsCount: number;
  paidWithdrawalsCount: number;
  selfPurchaseCount: number;
  earningsLast24hCents: number;
  earningsLast7dCents: number;
  largestBuyerSharePercent: number;
  pixKeyChanged: boolean;
  firstWithdrawal: boolean;
  paymentSplitMismatchCount: number;
  requestStillBacked: boolean;
  recentSales: AdminWithdrawalRecentSale[];
  recentWithdrawals: AdminWithdrawalRecentHistory[];
}

export async function getAdminWithdrawalRisk(
  supabase: SupabaseClient,
  withdrawalId: string,
): Promise<AdminWithdrawalRisk> {
  const { data, error } = await supabase
    .rpc("get_admin_withdrawal_risk", { p_withdrawal_id: withdrawalId })
    .single();

  if (error) throw new Error(error.message);

  const row = data as Record<string, unknown>;
  const numberValue = (value: unknown) => Number(value ?? 0);
  const nullableNumber = (value: unknown) =>
    value === null || value === undefined ? null : Number(value);

  return {
    withdrawalId: String(row.withdrawal_id),
    creatorId: String(row.creator_id),
    creatorUsername: row.creator_username ? String(row.creator_username) : null,
    creatorDisplayName: row.creator_display_name ? String(row.creator_display_name) : null,
    verificationStatus: row.verification_status ? String(row.verification_status) : null,
    accountCreatedAt: String(row.account_created_at),
    withdrawalAmountCents: numberValue(row.withdrawal_amount_cents),
    withdrawalStatus: String(row.withdrawal_status) as WithdrawalStatus,
    pixKeyType: String(row.pix_key_type) as PixKeyType,
    pixKey: String(row.pix_key),
    requestedAt: String(row.requested_at),
    snapshotEarnedCents: nullableNumber(row.snapshot_earned_cents),
    snapshotEligibleCents: nullableNumber(row.snapshot_eligible_cents),
    snapshotPendingReleaseCents: nullableNumber(row.snapshot_pending_release_cents),
    snapshotAvailableBeforeCents: nullableNumber(row.snapshot_available_before_cents),
    currentEarnedCents: numberValue(row.current_earned_cents),
    currentEligibleCents: numberValue(row.current_eligible_cents),
    currentPendingReleaseCents: numberValue(row.current_pending_release_cents),
    currentReservedCents: numberValue(row.current_reserved_cents),
    currentWithdrawnCents: numberValue(row.current_withdrawn_cents),
    currentAvailableCents: numberValue(row.current_available_cents),
    paidSalesCount: numberValue(row.paid_sales_count),
    productSalesCount: numberValue(row.product_sales_count),
    serviceSalesCount: numberValue(row.service_sales_count),
    uniqueBuyersCount: numberValue(row.unique_buyers_count),
    completedServicesCount: numberValue(row.completed_services_count),
    openServiceOrdersCount: numberValue(row.open_service_orders_count),
    openDisputesCount: numberValue(row.open_disputes_count),
    totalDisputesCount: numberValue(row.total_disputes_count),
    problemPaymentsCount: numberValue(row.problem_payments_count),
    rejectedWithdrawalsCount: numberValue(row.rejected_withdrawals_count),
    paidWithdrawalsCount: numberValue(row.paid_withdrawals_count),
    selfPurchaseCount: numberValue(row.self_purchase_count),
    earningsLast24hCents: numberValue(row.earnings_last_24h_cents),
    earningsLast7dCents: numberValue(row.earnings_last_7d_cents),
    largestBuyerSharePercent: numberValue(row.largest_buyer_share_percent),
    pixKeyChanged: Boolean(row.pix_key_changed),
    firstWithdrawal: Boolean(row.first_withdrawal),
    paymentSplitMismatchCount: numberValue(row.payment_split_mismatch_count),
    requestStillBacked: Boolean(row.request_still_backed),
    recentSales: Array.isArray(row.recent_sales)
      ? (row.recent_sales as AdminWithdrawalRecentSale[])
      : [],
    recentWithdrawals: Array.isArray(row.recent_withdrawals)
      ? (row.recent_withdrawals as AdminWithdrawalRecentHistory[])
      : [],
  };
}


export interface CreatorPayoutAccount {
  pixKeyType: PixKeyType;
  pixKey: string;
  createdAt: string;
  updatedAt: string;
  changedAt: string;
  eligibleAfter: string;
  changeCount: number;
  canWithdrawNow: boolean;
}

function mapPayoutAccount(row: Record<string, unknown>): CreatorPayoutAccount {
  return {
    pixKeyType: String(row.pix_key_type) as PixKeyType,
    pixKey: String(row.pix_key),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    changedAt: String(row.changed_at),
    eligibleAfter: String(row.eligible_after),
    changeCount: Number(row.change_count ?? 0),
    canWithdrawNow: Boolean(row.can_withdraw_now),
  };
}

export async function getMyPayoutAccount(
  supabase: SupabaseClient,
): Promise<CreatorPayoutAccount | null> {
  const { data, error } = await supabase.rpc("get_my_payout_account");

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return null;
  return mapPayoutAccount(rows[0]);
}

export async function setMyPayoutAccount(
  supabase: SupabaseClient,
  input: { pixKeyType: PixKeyType; pixKey: string },
): Promise<CreatorPayoutAccount> {
  const { data, error } = await supabase
    .rpc("set_my_payout_account", {
      p_pix_key_type: input.pixKeyType,
      p_pix_key: input.pixKey,
    })
    .single();

  if (error) throw new Error(error.message);
  return mapPayoutAccount(data as Record<string, unknown>);
}

export interface AdminPayoutAccountHistory {
  event_type: "created" | "changed" | "backfilled";
  old_pix_key_type: string | null;
  old_pix_key: string | null;
  new_pix_key_type: string;
  new_pix_key: string;
  changed_at: string;
}

export interface AdminWithdrawalPayoutAccount {
  creatorId: string;
  currentPixKeyType: PixKeyType;
  currentPixKey: string;
  createdAt: string;
  updatedAt: string;
  changedAt: string;
  eligibleAfter: string;
  changeCount: number;
  matchesWithdrawal: boolean;
  inCooldown: boolean;
  history: AdminPayoutAccountHistory[];
}

export async function getAdminWithdrawalPayoutAccount(
  supabase: SupabaseClient,
  withdrawalId: string,
): Promise<AdminWithdrawalPayoutAccount | null> {
  const { data, error } = await supabase.rpc(
    "get_admin_withdrawal_payout_account",
    { p_withdrawal_id: withdrawalId },
  );

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    creatorId: String(row.creator_id),
    currentPixKeyType: String(row.current_pix_key_type) as PixKeyType,
    currentPixKey: String(row.current_pix_key),
    createdAt: String(row.payout_created_at),
    updatedAt: String(row.payout_updated_at),
    changedAt: String(row.payout_changed_at),
    eligibleAfter: String(row.payout_eligible_after),
    changeCount: Number(row.payout_change_count ?? 0),
    matchesWithdrawal: Boolean(row.payout_matches_withdrawal),
    inCooldown: Boolean(row.payout_in_cooldown),
    history: Array.isArray(row.history)
      ? (row.history as AdminPayoutAccountHistory[])
      : [],
  };
}
