"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Clock3,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { CreatorBalance, PixKeyType, User, Withdrawal } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  getCreatorBalance,
  getMyPayoutAccount,
  listWithdrawalsForCreator,
  requestWithdrawal,
  setMyPayoutAccount,
  type CreatorPayoutAccount,
} from "@/lib/supabase/wallet";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { DashboardLoading } from "@/components/DashboardLoading";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";

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
    if (digits.length < 10 || digits.length > 13) {
      return "Confira o telefone informado.";
    }
  }
  if (
    type === "random" &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    )
  ) {
    return "Confira a chave aleatória Pix.";
  }
  return null;
}

export default function DashboardCarteiraPage() {
  const [creator, setCreator] = useState<User | null>(null);
  const [balance, setBalance] = useState<CreatorBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [payoutAccount, setPayoutAccount] =
    useState<CreatorPayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [editingPayout, setEditingPayout] = useState(false);
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>("cpf");
  const [pixKey, setPixKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const current = await getCurrentCreatorClient();
      const supabase = createClient();
      const [nextBalance, nextWithdrawals, nextPayoutAccount] =
        await Promise.all([
          getCreatorBalance(supabase, current.id),
          listWithdrawalsForCreator(supabase, current.id),
          getMyPayoutAccount(supabase),
        ]);

      setCreator(current);
      setBalance(nextBalance);
      setWithdrawals(nextWithdrawals);
      setPayoutAccount(nextPayoutAccount);

      if (nextPayoutAccount) {
        setPixKeyType(nextPayoutAccount.pixKeyType);
        setPixKey("");
      } else {
        setEditingPayout(true);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar sua carteira.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasPendingWithdrawal = withdrawals.some(
    (withdrawal) => withdrawal.status === "requested",
  );

  function handleRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!balance || !payoutAccount) return;

    setError(null);
    setFeedback(null);

    if (!payoutAccount.canWithdrawNow) {
      setError(
        "Sua chave Pix foi alterada recentemente. Aguarde o período de segurança antes de solicitar um novo saque.",
      );
      return;
    }

    const normalizedAmount = amount
      .trim()
      .replace(/\./g, "")
      .replace(",", ".");
    const amountCents = Math.round(Number(normalizedAmount) * 100);

    if (!amountCents || amountCents <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (amountCents > balance.availableCents) {
      setError("O valor é maior que o seu saldo disponível.");
      return;
    }

    setPendingWithdrawal(amountCents);
  }

  async function confirmWithdrawal() {
    if (!pendingWithdrawal) return;

    setSubmitting(true);
    setError(null);
    try {
      await requestWithdrawal(createClient(), {
        amountCents: pendingWithdrawal,
      });
      setPendingWithdrawal(null);
      setAmount("");
      setFeedback(
        "Pedido de saque enviado. Você recebe uma notificação quando ele for analisado.",
      );
      await load();
    } catch (err) {
      setPendingWithdrawal(null);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível solicitar o saque.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function savePayoutAccount(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    if (hasPendingWithdrawal) {
      setError(
        "A chave Pix não pode ser alterada enquanto existe um saque em análise.",
      );
      return;
    }

    const pixError = validatePixKey(pixKeyType, pixKey);
    if (pixError) {
      setError(pixError);
      return;
    }

    setSavingPayout(true);
    try {
      const existing = payoutAccount;
      const updated = await setMyPayoutAccount(createClient(), {
        pixKeyType,
        pixKey: pixKey.trim(),
      });

      setPayoutAccount(updated);
      setEditingPayout(false);
      setPixKey("");

      setFeedback(
        existing
          ? "Chave Pix alterada. Por segurança, novos saques ficam bloqueados por 24 horas."
          : "Chave Pix de recebimento cadastrada.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar sua chave Pix.",
      );
    } finally {
      setSavingPayout(false);
    }
  }

  if (loading) return <DashboardLoading />;

  if (loadError || !creator || !balance) {
    return (
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
        <p className="font-semibold text-(--color-text)">
          Não foi possível abrir sua carteira
        </p>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          {loadError ?? "Tente novamente."}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 text-sm font-medium text-(--color-accent-text) hover:underline"
        >
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
            {formatBRLFromCents(balance.pendingReleaseCents)} ainda não está
            liberado.
          </strong>{" "}
          Valores de serviços personalizados entram no saque somente depois
          que o trabalho é concluído.
        </div>
      ) : null}

      <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={17}
                strokeWidth={1.8}
                className="text-(--color-accent-text)"
              />
              <h2 className="font-semibold text-(--color-text)">
                Conta de recebimento
              </h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-(--color-text-muted)">
              Os saques usam somente esta chave Pix. Alterações ficam
              registradas e bloqueiam novos saques por 24 horas.
            </p>
          </div>

          {payoutAccount && !editingPayout ? (
            <button
              type="button"
              disabled={hasPendingWithdrawal}
              onClick={() => {
                setPixKeyType(payoutAccount.pixKeyType);
                setPixKey("");
                setEditingPayout(true);
              }}
              className="shrink-0 rounded-full border border-(--color-border) px-3 py-1.5 text-xs font-semibold text-(--color-text) disabled:cursor-not-allowed disabled:opacity-45"
            >
              Alterar
            </button>
          ) : null}
        </div>

        {payoutAccount && !editingPayout ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-(--color-border)">
            <InfoRow
              label="Tipo"
              value={PIX_KEY_TYPE_LABELS[payoutAccount.pixKeyType]}
            />
            <InfoRow
              label="Chave"
              value={maskPixKey(payoutAccount.pixKey)}
            />
            <InfoRow
              label="Alterações"
              value={String(payoutAccount.changeCount)}
            />
            <InfoRow
              label="Status para saque"
              value={
                payoutAccount.canWithdrawNow
                  ? "Liberada"
                  : `Bloqueada até ${new Date(
                      payoutAccount.eligibleAfter,
                    ).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}`
              }
            />
          </div>
        ) : (
          <form onSubmit={savePayoutAccount} className="mt-4 flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Tipo da chave
                <select
                  value={pixKeyType}
                  onChange={(event) =>
                    setPixKeyType(event.target.value as PixKeyType)
                  }
                  className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base outline-none focus:border-(--color-accent-text) sm:text-sm"
                >
                  {Object.entries(PIX_KEY_TYPE_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Chave Pix
                <input
                  value={pixKey}
                  onChange={(event) => setPixKey(event.target.value)}
                  autoComplete="off"
                  placeholder={
                    payoutAccount
                      ? "Digite a nova chave"
                      : pixKeyType === "email"
                        ? "seu@email.com"
                        : pixKeyType === "cpf"
                          ? "000.000.000-00"
                          : "Informe sua chave"
                  }
                  className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base outline-none focus:border-(--color-accent-text) sm:text-sm"
                />
              </label>
            </div>

            {payoutAccount ? (
              <p className="text-xs leading-relaxed text-(--color-warning)">
                Alterar a chave ativa um período de segurança de 24 horas. Nesse
                período, novos saques não podem ser solicitados nem concluídos.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={savingPayout || hasPendingWithdrawal}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-(--color-text) px-4 py-2 text-sm font-semibold text-(--color-bg) disabled:opacity-50"
              >
                {savingPayout ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                    strokeWidth={1.6}
                  />
                ) : null}
                {payoutAccount ? "Salvar nova chave" : "Cadastrar chave"}
              </button>

              {payoutAccount ? (
                <button
                  type="button"
                  disabled={savingPayout}
                  onClick={() => {
                    setEditingPayout(false);
                    setPixKey("");
                  }}
                  className="min-h-10 rounded-full border border-(--color-border) px-4 py-2 text-sm text-(--color-text)"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        )}

        {hasPendingWithdrawal ? (
          <p className="mt-3 text-xs text-(--color-text-muted)">
            A chave de recebimento fica bloqueada para alteração enquanto
            existir um saque em análise.
          </p>
        ) : null}
      </section>

      <form
        onSubmit={handleRequest}
        className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm"
      >
        <div>
          <h2 className="font-semibold text-(--color-text)">
            Solicitar saque
          </h2>
          <p className="mt-1 text-xs text-(--color-text-muted)">
            {!payoutAccount
              ? "Cadastre primeiro sua conta de recebimento Pix."
              : hasPendingWithdrawal
                ? "Você já tem um saque em análise. Aguarde a revisão antes de solicitar outro."
                : !payoutAccount.canWithdrawNow
                  ? "Sua chave Pix está no período de segurança de 24 horas."
                  : "O valor será enviado para a chave Pix cadastrada acima."}
          </p>
        </div>

        <label className="flex max-w-sm flex-col gap-1 text-sm text-(--color-text)">
          Valor
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            disabled={
              !payoutAccount ||
              !payoutAccount.canWithdrawNow ||
              hasPendingWithdrawal
            }
            className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base outline-none focus:border-(--color-accent-text) disabled:opacity-50 sm:text-sm"
          />
          <span className="text-xs text-(--color-text-subtle)">
            Disponível: {formatBRLFromCents(balance.availableCents)}
          </span>
        </label>

        {payoutAccount ? (
          <div className="flex max-w-sm items-center justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-(--color-text-subtle)">
                Receber em
              </p>
              <p className="mt-0.5 text-sm font-medium text-(--color-text)">
                {PIX_KEY_TYPE_LABELS[payoutAccount.pixKeyType]} ·{" "}
                {maskPixKey(payoutAccount.pixKey)}
              </p>
            </div>
            <ShieldCheck
              size={16}
              strokeWidth={1.7}
              className="shrink-0 text-(--color-accent-text)"
            />
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-(--color-danger)">{error}</p>
        ) : null}
        {feedback ? (
          <p className="text-sm text-(--color-success)">{feedback}</p>
        ) : null}

        <button
          type="submit"
          disabled={
            submitting ||
            balance.availableCents <= 0 ||
            hasPendingWithdrawal ||
            !payoutAccount ||
            !payoutAccount.canWithdrawNow
          }
          className="inline-flex w-fit items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2
              size={14}
              className="animate-spin"
              strokeWidth={1.6}
            />
          ) : null}
          {hasPendingWithdrawal ? "Saque em análise" : "Pedir saque"}
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
        <div className="border-b border-(--color-border) px-4 py-3">
          <h2 className="font-semibold text-(--color-text)">
            Histórico de saques
          </h2>
        </div>

        {withdrawals.length === 0 ? (
          <p className="px-4 py-8 text-sm text-(--color-text-muted)">
            Você ainda não pediu nenhum saque.
          </p>
        ) : (
          <div className="divide-y divide-(--color-border)">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-(--color-text)">
                    {formatBRLFromCents(withdrawal.amountCents)}
                  </p>
                  <p className="mt-0.5 text-xs text-(--color-text-muted)">
                    {PIX_KEY_TYPE_LABELS[withdrawal.pixKeyType]} ·{" "}
                    {maskPixKey(withdrawal.pixKey)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-xs text-(--color-text-subtle)">
                    {new Date(withdrawal.requestedAt).toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                  <StatusBadge status={withdrawal.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {pendingWithdrawal && payoutAccount ? (
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
              <InfoRow
                label="Valor"
                value={formatBRLFromCents(pendingWithdrawal)}
              />
              <InfoRow
                label={PIX_KEY_TYPE_LABELS[payoutAccount.pixKeyType]}
                value={maskPixKey(payoutAccount.pixKey)}
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-(--color-text-muted)">
              O saque usará exclusivamente a chave cadastrada na sua conta de
              recebimento.
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
                {submitting ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                    strokeWidth={1.6}
                  />
                ) : null}
                Confirmar saque
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-3">
      <span className="shrink-0 text-sm text-(--color-text-muted)">
        {label}
      </span>
      <strong className="min-w-0 break-all text-right text-sm text-(--color-text)">
        {value}
      </strong>
    </div>
  );
}
