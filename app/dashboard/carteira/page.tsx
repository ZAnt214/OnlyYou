"use client";

import { useEffect, useState } from "react";
import type { CreatorBalance, User } from "@/lib/types";
import { walletRepository } from "@/lib/repositories/WalletRepository";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { useWithdrawalRepository } from "@/lib/repositories/WithdrawalRepository";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Wallet, Clock, ArrowDownToLine } from "lucide-react";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardCarteiraPage() {
  const withdrawalRepo = useWithdrawalRepository();
  const [creator, setCreator] = useState<User | null>(null);
  const [balance, setBalance] = useState<CreatorBalance | null>(null);
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const c = await getCurrentCreatorClient();
      setCreator(c);
      // Um criador real ainda não tem linha em creatorBalances (dado mock,
      // não referencia UUIDs reais) — saldo zerado é o valor honesto aqui,
      // não um erro a esconder atrás de uma tela em branco.
      setBalance(
        (await walletRepository.findByCreator(c.id)) ?? {
          creatorId: c.id,
          available: 0,
          pending: 0,
          withdrawn: 0,
          currency: "BRL",
        },
      );
    })();
  }, []);

  if (!creator || !balance) return null;

  const withdrawals = withdrawalRepo.findByCreator(creator.id);

  function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0 || value > (balance?.available ?? 0)) {
      setFeedback("Informe um valor válido, dentro do saldo disponível.");
      return;
    }
    withdrawalRepo.create({
      id: `wd-${Date.now()}`,
      creatorId: creator!.id,
      amount: value,
      currency: "BRL",
      status: "requested",
      requestedAt: new Date().toISOString(),
    });
    setAmount("");
    setFeedback("Solicitação de saque registrada.");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-(--color-text)">Carteira</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Saldo disponível" value={formatBRL(balance.available)} icon={Wallet} />
        <StatCard label="Saldo pendente" value={formatBRL(balance.pending)} icon={Clock} />
        <StatCard label="Total já sacado" value={formatBRL(balance.withdrawn)} icon={ArrowDownToLine} />
      </div>

      <form
        onSubmit={handleRequest}
        className="flex flex-col gap-3 rounded-lg border border-(--color-border) p-4 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-(--color-text)">
          Valor do saque (R$)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          Solicitar saque
        </button>
      </form>
      {feedback ? <p className="text-sm text-(--color-text-muted)">{feedback}</p> : null}

      <div className="rounded-lg border border-(--color-border)">
        <h2 className="border-b border-(--color-border) px-4 py-3 text-sm font-medium text-(--color-text)">
          Histórico de saques
        </h2>
        {withdrawals.length === 0 ? (
          <p className="px-4 py-3 text-sm text-(--color-text-muted)">Nenhum saque solicitado ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {withdrawals
                .slice()
                .reverse()
                .map((w) => (
                  <tr key={w.id} className="border-b border-(--color-border) last:border-0">
                    <td className="px-4 py-3 text-(--color-text)">{formatBRL(w.amount)}</td>
                    <td className="px-4 py-3 text-(--color-text-muted)">
                      {new Date(w.requestedAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={w.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
