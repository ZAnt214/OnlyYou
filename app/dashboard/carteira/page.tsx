"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, Clock3, Loader2, TrendingUp, Wallet } from "lucide-react";
import type { CreatorBalance, PixKeyType, User, Withdrawal } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCreatorBalance, listWithdrawalsForCreator, requestWithdrawal } from "@/lib/supabase/wallet";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { DashboardLoading } from "@/components/DashboardLoading";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf: "CPF",
  email: "E-mail",
  phone: "Telefone",
  random: "Chave aleatória",
};

function maskPixKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "••••";
  return `•••• ${trimmed.slice(-4)}`;
}

function validatePixKey(type: PixKeyType, value: string): string | null {
  const key = value.trim();
  if (!key) return "Informe sua chave Pix.";

  if (type === "cpf" && key.replace(/\D/g, "").length !== 11) {
    return "Confira o CPF informado.";
  }
  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
    return "Confira o e-mail informado.";
  }
  if (type === "phone") {
    const digits = key.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) return "Confira o telefone informado.";
  }
  if (type === "random" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    return "Confira a chave aleatória Pix.";
  }
  return null;
}

export default function DashboardCarteiraPage() {
  const [creator, setCreator] = useState<User | null>(null);
  const [balance, setBalance] = useState<CreatorBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>("cpf");
  const [pixKey, setPixKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{
    amountCents: number;
    pixKeyType: PixKeyType;
    pixKey: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const current = await getCurrentCreatorClient();
      const supabase = createClient();
      const [nextBalance, nextWithdrawals] = await Promise.all([
        getCreatorBalance(supabase, current.id),
        listWithdrawalsForCreator(supabase, current.id),
      ]);
      setCreator(current);
      setBalance(nextBalance);
      setWithdrawals(nextWithdrawals);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Não foi possível carregar sua carteira.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!balance) return;

    setError(null);
    setFeedback(null);

    const normalizedAmount = amount.trim().replace(/\./g, "").replace(",", ".");
    const amountCents = Math.round(Number(normalizedAmount) * 100);
    if (!amountCents || amountCents <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (amountCents > balance.availableCents) {
      setError("O valor é maior que o seu saldo disponível.");
      return;
    }

    const pixError = validatePixKey(pixKeyType, pixKey);
    if (pixError) {
      setError(pixError);
      return;
    }

    setPendingWithdrawal({
      amountCents,
      pixKeyType,
      pixKey: pixKey.trim(),
    });
  }

  async function confirmWithdrawal() {
    if (!pendingWithdrawal) return;

    setSubmitting(true);
    setError(null);
    try {
      await requestWithdrawal(createClient(), pendingWithdrawal);
      setPendingWithdrawal(null);
      setAmount("");
      setPixKey("");
      setFeedback("Pedido de saque enviado. Você recebe uma notificação quando ele for analisado.");
      await load();
    } catch (err) {
      setPendingWithdrawal(null);
      setError(err instanceof Error ? err.message : "Não foi possível solicitar o saque.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasPendingWithdrawal = withdrawals.some(
    (withdrawal) => withdrawal.status === "requested",
  );

  if (loading) return <DashboardLoading />;

  if (loadError || !creator || !balance) {
    return (
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
        <p className="font-semibold text-(--color-text)">Não foi possível abrir sua carteira</p>
        <p className="mt-1 text-sm text-(--color-text-muted)">{loadError ?? "Tente novamente."}</p>
        <button type="button" onClick={() => void load()} className="mt-4 text-sm font-medium text-(--color-accent-text) hover:underline">
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Dinheiro"
        title="Carteira"
        description="Pagamentos ficam visíveis aqui, mas serviços só entram no saldo sacável depois que a contratação é concluída."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Disponível para saque"
          value={formatBRLFromCents(balance.availableCents)}
          icon={Wallet}
        />
        <StatCard
          label="A liberar"
          value={formatBRLFromCents(balance.pendingReleaseCents)}
          icon={Clock3}
          hint="Serviços pagos que ainda não foram concluídos"
        />
        <StatCard
          label="Total recebido"
          value={formatBRLFromCents(balance.earnedCents)}
          icon={TrendingUp}
        />
        <StatCard
          label="Já sacado"
          value={formatBRLFromCents(balance.withdrawnCents)}
          icon={ArrowDownToLine}
        />
      </div>

      {balance.pendingReleaseCents > 0 ? (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface-2) px-4 py-3 text-sm text-(--color-text-muted)">
          <strong className="text-(--color-text)">
            {formatBRLFromCents(balance.pendingReleaseCents)} ainda não está liberado.
          </strong>{" "}
          Valores de serviços personalizados entram no saque somente depois que o trabalho é concluído.
        </div>
      ) : null}

      <form onSubmit={handleRequest} className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
        <div>
          <h2 className="font-semibold text-(--color-text)">Solicitar saque</h2>
          <p className="mt-1 text-xs text-(--color-text-muted)">
            {hasPendingWithdrawal
              ? "Você já tem um saque em análise. Aguarde a revisão antes de solicitar outro."
              : "Confira a chave com atenção antes de enviar."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-(--color-text)">
            Valor
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base focus:border-(--color-accent-text) focus:outline-none sm:text-sm"
            />
            <span className="text-xs text-(--color-text-subtle)">Disponível: {formatBRLFromCents(balance.availableCents)}</span>
          </label>

          <label className="flex flex-col gap-1 text-sm text-(--color-text)">
            Tipo da chave
            <select
              value={pixKeyType}
              onChange={(event) => setPixKeyType(event.target.value as PixKeyType)}
              className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base focus:border-(--color-accent-text) focus:outline-none sm:text-sm"
            >
              {Object.entries(PIX_KEY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-(--color-text)">
            Chave Pix
            <input
              value={pixKey}
              onChange={(event) => setPixKey(event.target.value)}
              autoComplete="off"
              placeholder={pixKeyType === "email" ? "seu@email.com" : pixKeyType === "cpf" ? "000.000.000-00" : "Informe sua chave"}
              className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base focus:border-(--color-accent-text) focus:outline-none sm:text-sm"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
        {feedback ? <p className="text-sm text-(--color-success)">{feedback}</p> : null}

        <button
          type="submit"
          disabled={submitting || balance.availableCents <= 0 || hasPendingWithdrawal}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" strokeWidth={1.6} /> : null}
          {hasPendingWithdrawal ? "Saque em análise" : "Pedir saque"}
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
        <div className="border-b border-(--color-border) px-4 py-3">
          <h2 className="font-semibold text-(--color-text)">Histórico de saques</h2>
        </div>

        {withdrawals.length === 0 ? (
          <p className="px-4 py-8 text-sm text-(--color-text-muted)">Você ainda não pediu nenhum saque.</p>
        ) : (
          <div className="divide-y divide-(--color-border)">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-(--color-text)">{formatBRLFromCents(withdrawal.amountCents)}</p>
                  <p className="mt-0.5 text-xs text-(--color-text-muted)">
                    {PIX_KEY_TYPE_LABELS[withdrawal.pixKeyType]} · {maskPixKey(withdrawal.pixKey)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-xs text-(--color-text-subtle)">{new Date(withdrawal.requestedAt).toLocaleDateString("pt-BR")}</span>
                  <StatusBadge status={withdrawal.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {pendingWithdrawal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Cancelar confirmação"
            onClick={() => setPendingWithdrawal(null)}
            className="absolute inset-0 bg-(--color-contrast) opacity-55"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
              Confirmar saque
            </p>
            <h2 className="mt-1 text-lg font-semibold text-(--color-text)">
              Confira antes de enviar
            </h2>

            <div className="mt-4 divide-y divide-(--color-border) rounded-xl border border-(--color-border)">
              <div className="flex items-center justify-between gap-3 px-3 py-3">
                <span className="text-sm text-(--color-text-muted)">Valor</span>
                <strong className="text-sm text-(--color-text)">
                  {formatBRLFromCents(pendingWithdrawal.amountCents)}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-3">
                <span className="text-sm text-(--color-text-muted)">
                  {PIX_KEY_TYPE_LABELS[pendingWithdrawal.pixKeyType]}
                </span>
                <strong className="text-sm text-(--color-text)">
                  {maskPixKey(pendingWithdrawal.pixKey)}
                </strong>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-(--color-text-muted)">
              Depois de confirmar, o pedido entra na fila de análise. Confira principalmente a chave Pix.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setPendingWithdrawal(null)}
                className="rounded-full border border-(--color-border) px-4 py-2.5 text-sm text-(--color-text) disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void confirmWithdrawal()}
                className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent) disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" strokeWidth={1.6} /> : null}
                Confirmar saque
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
