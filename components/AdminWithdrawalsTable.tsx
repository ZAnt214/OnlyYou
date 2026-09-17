"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { reviewWithdrawal, type AdminWithdrawalRow } from "@/lib/supabase/wallet";
import { StatusBadge } from "@/components/StatusBadge";
import type { PixKeyType } from "@/lib/types";
import { Check, X, Loader2 } from "lucide-react";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf: "CPF",
  email: "E-mail",
  phone: "Telefone",
  random: "Chave aleatória",
};

export function AdminWithdrawalsTable({ initialWithdrawals }: { initialWithdrawals: AdminWithdrawalRow[] }) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(withdrawalId: string, status: "paid" | "rejected") {
    setError(null);
    setBusyId(withdrawalId);
    try {
      const supabase = createClient();
      const updated = await reviewWithdrawal(supabase, { withdrawalId, status });
      setWithdrawals((prev) => prev.map((w) => (w.id === withdrawalId ? { ...w, ...updated } : w)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o saque.");
    } finally {
      setBusyId(null);
    }
  }

  if (withdrawals.length === 0) {
    return <p className="text-sm text-(--color-text-muted)">Nenhum saque solicitado ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-(--color-border)">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-(--color-border) text-xs text-(--color-text-subtle)">
            <tr>
              <th className="px-3 py-2 font-medium">Criador</th>
              <th className="px-3 py-2 font-medium">Valor</th>
              <th className="px-3 py-2 font-medium">Chave Pix</th>
              <th className="px-3 py-2 font-medium">Solicitado em</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-(--color-border) last:border-0">
                <td className="px-3 py-3 text-(--color-text)">
                  {w.creatorDisplayName ?? w.creatorUsername ?? w.creatorId}
                </td>
                <td className="px-3 py-3 text-(--color-text)">{formatBRLFromCents(w.amountCents)}</td>
                <td className="px-3 py-3 text-(--color-text-muted)">
                  {PIX_KEY_TYPE_LABELS[w.pixKeyType]} · {w.pixKey}
                </td>
                <td className="px-3 py-3 text-(--color-text-subtle)">
                  {new Date(w.requestedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={w.status} />
                </td>
                <td className="px-3 py-3">
                  {w.status === "requested" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === w.id}
                        onClick={() => handleReview(w.id, "paid")}
                        className="flex items-center gap-1 rounded-full bg-(--color-accent) px-3 py-1.5 text-xs font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
                      >
                        {busyId === w.id ? (
                          <Loader2 size={12} className="animate-spin" strokeWidth={1.5} />
                        ) : (
                          <Check size={12} strokeWidth={1.5} />
                        )}
                        Marcar como pago
                      </button>
                      <button
                        type="button"
                        disabled={busyId === w.id}
                        onClick={() => handleReview(w.id, "rejected")}
                        className="flex items-center gap-1 rounded-full border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text) hover:bg-(--color-surface-2) disabled:opacity-60"
                      >
                        <X size={12} strokeWidth={1.5} />
                        Recusar
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-(--color-text-subtle)">
                      {w.reviewedAt
                        ? new Date(w.reviewedAt).toLocaleDateString("pt-BR")
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
  );
}
