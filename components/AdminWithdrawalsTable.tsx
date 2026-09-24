"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reviewWithdrawal, type AdminWithdrawalRow } from "@/lib/supabase/wallet";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminWithdrawalDossier } from "@/components/AdminWithdrawalDossier";
import type { PixKeyType } from "@/lib/types";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function maskPixKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "••••";
  return `•••• ${trimmed.slice(-4)}`;
}

const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf: "CPF",
  email: "E-mail",
  phone: "Telefone",
  random: "Chave aleatória",
};

type ReviewAction = {
  withdrawal: AdminWithdrawalRow;
  status: "paid" | "rejected";
};

type QueueFilter = "requested" | "paid" | "rejected" | "all";

const FILTERS: Array<{ id: QueueFilter; label: string }> = [
  { id: "requested", label: "Pendentes" },
  { id: "paid", label: "Pagos" },
  { id: "rejected", label: "Recusados" },
  { id: "all", label: "Todos" },
];

export function AdminWithdrawalsTable({
  initialWithdrawals,
}: {
  initialWithdrawals: AdminWithdrawalRow[];
}) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [filter, setFilter] = useState<QueueFilter>("requested");
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<AdminWithdrawalRow | null>(null);
  const [pendingReview, setPendingReview] = useState<ReviewAction | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      requested: withdrawals.filter((w) => w.status === "requested").length,
      paid: withdrawals.filter((w) => w.status === "paid").length,
      rejected: withdrawals.filter((w) => w.status === "rejected").length,
      all: withdrawals.length,
    }),
    [withdrawals],
  );

  const visibleWithdrawals = useMemo(() => {
    if (filter === "all") return withdrawals;
    return withdrawals.filter((withdrawal) => withdrawal.status === filter);
  }, [filter, withdrawals]);

  function openReview(
    withdrawal: AdminWithdrawalRow,
    status: "paid" | "rejected",
  ) {
    setSelectedWithdrawal(null);
    setAdminNotes("");
    setPendingReview({ withdrawal, status });
  }

  async function handleReview(
    withdrawalId: string,
    status: "paid" | "rejected",
  ) {
    if (status === "rejected" && adminNotes.trim().length < 4) {
      setError("Explique brevemente o motivo da recusa.");
      return;
    }

    setError(null);
    setBusyId(withdrawalId);

    try {
      const updated = await reviewWithdrawal(createClient(), {
        withdrawalId,
        status,
        adminNotes: adminNotes.trim() || undefined,
      });

      setWithdrawals((prev) =>
        prev.map((withdrawal) =>
          withdrawal.id === withdrawalId
            ? { ...withdrawal, ...updated }
            : withdrawal,
        ),
      );
      setPendingReview(null);
      setAdminNotes("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o saque.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (withdrawals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-(--color-border) px-5 py-9 text-center">
        <p className="font-semibold text-(--color-text)">
          Nenhum saque solicitado
        </p>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          Novas solicitações dos criadores aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {error && !pendingReview ? (
          <p className="rounded-xl border border-(--color-danger) px-3 py-2 text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-(--color-text) bg-(--color-text) text-(--color-bg)"
                    : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted)"
                }`}
              >
                {item.label}
                <span className={active ? "opacity-70" : "text-(--color-text-subtle)"}>
                  {counts[item.id]}
                </span>
              </button>
            );
          })}
        </div>

        {visibleWithdrawals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-(--color-border) px-4 py-7 text-center">
            <p className="text-sm font-medium text-(--color-text)">
              Nenhuma solicitação nesta fila
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) md:hidden">
              {visibleWithdrawals.map((withdrawal) => {
                const creatorName =
                  withdrawal.creatorDisplayName ??
                  withdrawal.creatorUsername ??
                  "Criador";

                return (
                  <button
                    key={withdrawal.id}
                    type="button"
                    onClick={() => setSelectedWithdrawal(withdrawal)}
                    className="flex w-full items-center gap-3 border-b border-(--color-border) px-4 py-3 text-left last:border-b-0 hover:bg-(--color-surface-2)"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold text-(--color-text)">
                          {creatorName}
                        </p>
                        <StatusBadge status={withdrawal.status} />
                      </div>
                      <p className="mt-1 text-[11px] text-(--color-text-subtle)">
                        {new Date(withdrawal.requestedAt).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-(--color-text)">
                        {formatBRLFromCents(withdrawal.amountCents)}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-(--color-accent-text)">
                        {withdrawal.status === "requested" ? "Revisar" : "Ver"}
                        <ChevronRight size={13} strokeWidth={1.8} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-(--color-border) md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-(--color-border) text-xs text-(--color-text-subtle)">
                  <tr>
                    <th className="px-3 py-3 font-medium">Criador</th>
                    <th className="px-3 py-3 font-medium">Valor</th>
                    <th className="px-3 py-3 font-medium">Pix</th>
                    <th className="px-3 py-3 font-medium">Solicitado em</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleWithdrawals.map((withdrawal) => (
                    <tr
                      key={withdrawal.id}
                      className="border-b border-(--color-border) last:border-0"
                    >
                      <td className="px-3 py-3 text-(--color-text)">
                        {withdrawal.creatorDisplayName ??
                          withdrawal.creatorUsername ??
                          withdrawal.creatorId}
                      </td>
                      <td className="px-3 py-3 font-semibold text-(--color-text)">
                        {formatBRLFromCents(withdrawal.amountCents)}
                      </td>
                      <td className="px-3 py-3 text-(--color-text-muted)">
                        {PIX_KEY_TYPE_LABELS[withdrawal.pixKeyType]} ·{" "}
                        {maskPixKey(withdrawal.pixKey)}
                      </td>
                      <td className="px-3 py-3 text-(--color-text-subtle)">
                        {new Date(withdrawal.requestedAt).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={withdrawal.status} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                          className="rounded-full border border-(--color-border) px-3 py-1.5 text-xs font-semibold text-(--color-text) hover:bg-(--color-surface-2)"
                        >
                          {withdrawal.status === "requested" ? "Revisar" : "Ver detalhes"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedWithdrawal ? (
        <AdminWithdrawalDossier
          withdrawal={selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
          onReview={(status) => openReview(selectedWithdrawal, status)}
        />
      ) : null}

      {pendingReview ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Fechar confirmação"
            disabled={busyId === pendingReview.withdrawal.id}
            onClick={() => {
              setPendingReview(null);
              setAdminNotes("");
              setError(null);
            }}
            className="absolute inset-0 bg-black/60"
          />

          <div className="relative w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-lg">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-subtle)">
              {pendingReview.status === "paid"
                ? "Confirmação final"
                : "Recusar saque"}
            </p>
            <h2 className="mt-1 text-lg font-bold text-(--color-text)">
              {pendingReview.status === "paid"
                ? "O Pix já foi enviado?"
                : "Por que este saque será recusado?"}
            </h2>

            <div className="mt-4 rounded-xl border border-(--color-border)">
              <DetailRow
                label="Criador"
                value={
                  pendingReview.withdrawal.creatorDisplayName ??
                  pendingReview.withdrawal.creatorUsername ??
                  "Criador"
                }
              />
              <DetailRow
                label="Valor"
                value={formatBRLFromCents(pendingReview.withdrawal.amountCents)}
              />
              <DetailRow
                label="Pix"
                value={`${PIX_KEY_TYPE_LABELS[pendingReview.withdrawal.pixKeyType]} · ${pendingReview.withdrawal.pixKey}`}
                breakAll
              />
            </div>

            <label className="mt-4 flex flex-col gap-1.5 text-sm text-(--color-text)">
              {pendingReview.status === "paid"
                ? "Referência ou observação (opcional)"
                : "Motivo da recusa"}
              <textarea
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={
                  pendingReview.status === "paid"
                    ? "Ex.: Pix conferido e enviado manualmente."
                    : "Registre o motivo para manter o histórico da análise."
                }
                className="resize-none rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base outline-none focus:border-(--color-accent-text) sm:text-sm"
              />
            </label>

            {error ? (
              <p className="mt-2 text-xs text-(--color-danger)">{error}</p>
            ) : null}

            <p className="mt-3 text-xs leading-relaxed text-(--color-text-muted)">
              {pendingReview.status === "paid"
                ? "O banco fará uma última conciliação antes de aceitar a baixa. Se o saldo elegível tiver caído desde a solicitação, a confirmação será bloqueada."
                : "Ao recusar, o valor deixa de ficar reservado e volta ao saldo elegível do criador."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busyId === pendingReview.withdrawal.id}
                onClick={() => {
                  setPendingReview(null);
                  setAdminNotes("");
                  setError(null);
                }}
                className="min-h-11 rounded-full border border-(--color-border) px-4 py-2.5 text-sm font-medium text-(--color-text) disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={
                  busyId === pendingReview.withdrawal.id ||
                  (pendingReview.status === "rejected" &&
                    adminNotes.trim().length < 4)
                }
                onClick={() =>
                  void handleReview(
                    pendingReview.withdrawal.id,
                    pendingReview.status,
                  )
                }
                className={
                  pendingReview.status === "paid"
                    ? "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent) disabled:opacity-50"
                    : "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-(--color-text) px-4 py-2.5 text-sm font-semibold text-(--color-bg) disabled:opacity-50"
                }
              >
                {busyId === pendingReview.withdrawal.id ? (
                  <Loader2 size={14} className="animate-spin" strokeWidth={1.6} />
                ) : pendingReview.status === "paid" ? (
                  <Check size={14} strokeWidth={1.8} />
                ) : (
                  <X size={14} strokeWidth={1.8} />
                )}
                {pendingReview.status === "paid"
                  ? "Confirmar pago"
                  : "Confirmar recusa"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DetailRow({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-(--color-border) px-3 py-3 last:border-b-0">
      <span className="shrink-0 text-xs text-(--color-text-muted)">{label}</span>
      <strong
        className={`min-w-0 text-right text-xs text-(--color-text) ${
          breakAll ? "break-all" : ""
        }`}
      >
        {value}
      </strong>
    </div>
  );
}
