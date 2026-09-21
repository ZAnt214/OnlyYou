"use client";

import { useCallback, useEffect, useState } from "react";
import type { CreatorBalance, PixKeyType, User, Withdrawal } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCreatorBalance, listWithdrawalsForCreator, requestWithdrawal } from "@/lib/supabase/wallet";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Wallet, TrendingUp, ArrowDownToLine, Loader2 } from "lucide-react";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf: "CPF",
  email: "E-mail",
  phone: "Telefone",
  random: "Chave aleatória",
};

export default function DashboardCarteiraPage() {
  const [creator, setCreator] = useState<User | null>(null);
  const [balance, setBalance] = useState<CreatorBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>("cpf");
  const [pixKey, setPixKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const c = await getCurrentCreatorClient();
    setCreator(c);
    const supabase = createClient();
    const [b, w] = await Promise.all([
      getCreatorBalance(supabase, c.id),
      listWithdrawalsForCreator(supabase, c.id),
    ]);
    setBalance(b);
    setWithdrawals(w);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const amountCents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!amountCents || amountCents <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!pixKey.trim()) {
      setError("Informe sua chave Pix.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      await requestWithdrawal(supabase, { amountCents, pixKeyType, pixKey });
      setAmount("");
      setPixKey("");
      setFeedback("Solicitação de saque enviada. Você recebe uma notificação quando ela for concluída.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível solicitar o saque.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !creator || !balance) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-(--color-text-muted)">
        <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
        Carregando…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Carteira</h1>
        <p className="text-sm text-(--color-text-muted)">
          Todo pagamento recebido pela plataforma vira saldo aqui, já descontada a comissão do
          Jobê. O saque é feito manualmente pela nossa equipe via Pix, para a chave que você
          informar abaixo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Saldo disponível" value={formatBRLFromCents(balance.availableCents)} icon={Wallet} />
        <StatCard label="Total já ganho" value={formatBRLFromCents(balance.earnedCents)} icon={TrendingUp} />
        <StatCard
          label="Total já sacado"
          value={formatBRLFromCents(balance.withdrawnCents)}
          icon={ArrowDownToLine}
        />
      </div>

      <form
        onSubmit={handleRequest}
        className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm"
      >
        <h2 className="text-sm font-medium text-(--color-text)">Solicitar saque</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-(--color-text)">
            Valor (R$)
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-(--color-text)">
            Tipo de chave Pix
            <select
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
              className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
            >
              {Object.entries(PIX_KEY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-(--color-text)">
            Chave Pix
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
            />
          </label>
        </div>
        {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
        {feedback ? <p className="text-sm text-(--color-success)">{feedback}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded-full bg-(--color-accent) px-5 py-2 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
        >
          Solicitar saque
        </button>
      </form>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
        <h2 className="border-b border-(--color-border) px-4 py-3 text-sm font-medium text-(--color-text)">
          Histórico de saques
        </h2>
        {withdrawals.length === 0 ? (
          <p className="px-4 py-3 text-sm text-(--color-text-muted)">Nenhum saque solicitado ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-(--color-border) last:border-0">
                  <td className="px-4 py-3 text-(--color-text)">{formatBRLFromCents(w.amountCents)}</td>
                  <td className="px-4 py-3 text-(--color-text-muted)">
                    {PIX_KEY_TYPE_LABELS[w.pixKeyType]} · {w.pixKey}
                  </td>
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
