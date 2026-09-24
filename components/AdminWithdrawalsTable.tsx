"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { reviewWithdrawal, type AdminWithdrawalRow } from "@/lib/supabase/wallet";
import { StatusBadge } from "@/components/StatusBadge";
import type { PixKeyType } from "@/lib/types";
import { Check, Loader2, X } from "lucide-react";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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

export function AdminWithdrawalsTable({
  initialWithdrawals,
}: {
  initialWithdrawals: AdminWithdrawalRow[];
}) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<ReviewAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(withdrawalId: string, status: "paid" | "rejected") {
    setError(null);
    setBusyId(withdrawalId);

    try {
      const supabase = createClient();
      const updated = await reviewWithdrawal(supabase, {
        withdrawalId,
        status,
      });

      setWithdrawals((prev) =>
        prev.map((withdrawal) =>
          withdrawal.id === withdrawalId
            ? { ...withdrawal, ...updated }
            : withdrawal,
        ),
      );
      setPendingReview(null);
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
        {error ? (
          <p className="rounded-xl border border-(--color-danger) px-3 py-2 text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 md:hidden">
          {withdrawals.map((withdrawal) => {
            const creatorName =
              withdrawal.creatorDisplayName ??
              withdrawal.creatorUsername ??
              "Criador";

            return (
              <article
                key={withdrawal.id}
                className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)"
              >
                <div className="flex items-start justify-between gap-3 px-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-(--color-text)">
                      {creatorName}
                    </p>
                    <p className="mt-1 text-xs text-(--color-text-muted)">
                      Solicitado em{" "}
                      {new Date(withdrawal.requestedAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <StatusBadge status={withdrawal.status} />
                </div>

                <div className="grid grid-cols-2 border-y border-(--color-border)">
                  <div className="border-r border-(--color-border) px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
                      Valor
                    </p>
                    <p className="mt-1 text-lg font-bold text-(--color-text)">
                      {formatBRLFromCents(withdrawal.amountCents)}
                    </p>
                  </div>
                  <div className="min-w-0 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
                      Chave Pix
                    </p>
                    <p className="mt-1 text-xs font-medium text-(--color-text-muted)">
                      {PIX_KEY_TYPE_LABELS[withdrawal.pixKeyType]}
                    </p>
                    <p className="mt-0.5 break-all text-sm font-medium text-(--color-text)">
                      {withdrawal.pixKey}
                    </p>
                  </div>
                </div>

                {withdrawal.status === "requested" ? (
                  <div className="grid grid-cols-2 gap-2 p-3">
                    <button
                      type="button"
                      disabled={busyId === withdrawal.id}
                      onClick={() =>
                        setPendingReview({ withdrawal, status: "paid" })
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-(--color-accent) px-3 py-2 text-xs font-semibold text-(--color-on-accent) transition-colors hover:bg-(--color-accent-hover) disabled:opacity-60"
                    >
                      {busyId === withdrawal.id ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                          strokeWidth={1.6}
                        />
                      ) : (
                        <Check size={14} strokeWidth={1.8} />
                      )}
                      Marcar pago
                    </button>
                    <button
                      type="button"
                      disabled={busyId === withdrawal.id}
                      onClick={() =>
                        setPendingReview({ withdrawal, status: "rejected" })
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-(--color-border) px-3 py-2 text-xs font-semibold text-(--color-text) transition-colors hover:bg-(--color-surface-2) disabled:opacity-60"
                    >
                      <X size={14} strokeWidth={1.8} />
                      Recusar
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-xs text-(--color-text-subtle)">
                    Revisado em{" "}
                    {withdrawal.reviewedAt
                      ? new Date(withdrawal.reviewedAt).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto rounded-2xl border border-(--color-border) md:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-(--color-border) text-xs text-(--color-text-subtle)">
              <tr>
                <th className="px-3 py-3 font-medium">Criador</th>
                <th className="px-3 py-3 font-medium">Valor</th>
                <th className="px-3 py-3 font-medium">Chave Pix</th>
                <th className="px-3 py-3 font-medium">Solicitado em</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
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
                  <td className="max-w-64 px-3 py-3 text-(--color-text-muted)">
                    <span className="font-medium">
                      {PIX_KEY_TYPE_LABELS[withdrawal.pixKeyType]}
                    </span>
                    <span className="mx-1">·</span>
                    <span className="break-all">{withdrawal.pixKey}</span>
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
                  <td className="px-3 py-3">
                    {withdrawal.status === "requested" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === withdrawal.id}
                          onClick={() =>
                            setPendingReview({
                              withdrawal,
                              status: "paid",
                            })
                          }
                          className="flex items-center gap-1 rounded-full bg-(--color-accent) px-3 py-1.5 text-xs font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
                        >
                          <Check size={12} strokeWidth={1.5} />
                          Marcar como pago
                        </button>
                        <button
                          type="button"
                          disabled={busyId === withdrawal.id}
                          onClick={() =>
                            setPendingReview({
                              withdrawal,
                              status: "rejected",
                            })
                          }
                          className="flex items-center gap-1 rounded-full border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text) hover:bg-(--color-surface-2) disabled:opacity-60"
                        >
                          <X size={12} strokeWidth={1.5} />
                          Recusar
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-(--color-text-subtle)">
                        {withdrawal.reviewedAt
                          ? new Date(
                              withdrawal.reviewedAt,
                            ).toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pendingReview ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Fechar confirmação"
            disabled={busyId === pendingReview.withdrawal.id}
            onClick={() => setPendingReview(null)}
            className="absolute inset-0 bg-black/55"
          />

          <div className="relative w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-lg">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-subtle)">
              {pendingReview.status === "paid"
                ? "Confirmar pagamento"
                : "Confirmar recusa"}
            </p>
            <h2 className="mt-1 text-lg font-bold text-(--color-text)">
              {pendingReview.status === "paid"
                ? "O Pix já foi enviado?"
                : "Recusar este saque?"}
            </h2>

            <div className="mt-4 rounded-xl border border-(--color-border)">
              <div className="flex items-center justify-between gap-3 border-b border-(--color-border) px-3 py-3">
                <span className="text-sm text-(--color-text-muted)">Criador</span>
                <strong className="truncate text-sm text-(--color-text)">
                  {pendingReview.withdrawal.creatorDisplayName ??
                    pendingReview.withdrawal.creatorUsername ??
                    "Criador"}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-3">
                <span className="text-sm text-(--color-text-muted)">Valor</span>
                <strong className="text-sm text-(--color-text)">
                  {formatBRLFromCents(pendingReview.withdrawal.amountCents)}
                </strong>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-(--color-text-muted)">
              {pendingReview.status === "paid"
                ? "Marque como pago somente depois de concluir a transferência Pix fora do Jobê. Essa ação registra o saque como concluído."
                : "Ao recusar, o valor deixa de ficar reservado e volta ao saldo disponível do criador."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busyId === pendingReview.withdrawal.id}
                onClick={() => setPendingReview(null)}
                className="min-h-11 rounded-full border border-(--color-border) px-4 py-2.5 text-sm font-medium text-(--color-text) disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={busyId === pendingReview.withdrawal.id}
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
