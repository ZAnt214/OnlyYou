"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getAdminWithdrawalPayoutAccount,
  getAdminWithdrawalRisk,
  type AdminWithdrawalPayoutAccount,
  type AdminWithdrawalRisk,
  type AdminWithdrawalRow,
} from "@/lib/supabase/wallet";
import { StatusBadge } from "@/components/StatusBadge";

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function maskPix(value: string): string {
  const clean = value.trim();
  if (clean.length <= 4) return "••••";
  return `•••• ${clean.slice(-4)}`;
}

function accountAgeDays(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
}

type SignalTone = "danger" | "warning" | "info" | "positive";

interface Signal {
  tone: SignalTone;
  title: string;
  detail: string;
}

type RecommendationLevel = "approve" | "review" | "hold";

interface SystemRecommendation {
  level: RecommendationLevel;
  title: string;
  detail: string;
  reasons: string[];
}

function buildRecommendation(
  risk: AdminWithdrawalRisk,
  payoutAccount: AdminWithdrawalPayoutAccount | null,
): SystemRecommendation {
  const blockers: string[] = [];
  const cautions: string[] = [];

  if (!risk.requestStillBacked) {
    blockers.push("o saldo elegível atual não cobre todos os saques reservados");
  }
  if (risk.paymentSplitMismatchCount > 0) {
    blockers.push("há inconsistência na divisão financeira de pagamentos");
  }
  if (risk.selfPurchaseCount > 0) {
    blockers.push("há pagamento em que comprador e criador são a mesma conta");
  }
  if (risk.openDisputesCount > 0) {
    blockers.push("há disputa aberta ligada aos serviços do criador");
  }
  if (!payoutAccount) {
    blockers.push("não há conta Pix de recebimento cadastrada");
  } else {
    if (!payoutAccount.matchesWithdrawal) {
      blockers.push("a chave Pix atual não corresponde à chave registrada no saque");
    }
    if (payoutAccount.inCooldown) {
      blockers.push("a conta Pix está dentro do período de segurança após alteração");
    }
  }

  if (risk.problemPaymentsCount > 0) {
    cautions.push("há histórico de estorno ou chargeback");
  }
  if (risk.verificationStatus !== "verified") {
    cautions.push("a conta ainda não está verificada");
  }
  if (accountAgeDays(risk.accountCreatedAt) < 7) {
    cautions.push("a conta foi criada há menos de 7 dias");
  }
  if (payoutAccount && !payoutAccount.matchesWithdrawal) {
    signals.push({
      tone: "danger",
      title: "Chave Pix divergente da conta atual",
      detail:
        "A chave cadastrada na conta de recebimento não corresponde à chave registrada neste saque.",
    });
  }

  if (payoutAccount?.inCooldown) {
    signals.push({
      tone: "danger",
      title: "Conta Pix em período de segurança",
      detail: `Novos pagamentos de saque ficam bloqueados até ${new Date(
        payoutAccount.eligibleAfter,
      ).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })}.`,
    });
  }

  if (risk.pixKeyChanged) {
    cautions.push("a chave Pix difere da última chave já paga");
  }
  if (payoutAccount && payoutAccount.changeCount > 0) {
    cautions.push(
      `a conta Pix já foi alterada ${payoutAccount.changeCount} vez(es)`,
    );
  }
  if (
    risk.paidSalesCount >= 2 &&
    risk.largestBuyerSharePercent >= 80
  ) {
    cautions.push("os ganhos estão muito concentrados em um único comprador");
  }
  if (
    risk.currentEarnedCents > 0 &&
    risk.paidSalesCount >= 2 &&
    risk.earningsLast24hCents / risk.currentEarnedCents >= 0.8
  ) {
    cautions.push("mais de 80% dos ganhos entraram nas últimas 24 horas");
  }
  if (risk.firstWithdrawal) {
    cautions.push("este é o primeiro saque da conta");
  }
  if (risk.rejectedWithdrawalsCount > 0) {
    cautions.push("há saque anterior recusado");
  }

  if (blockers.length > 0) {
    return {
      level: "hold",
      title: "Não aprovar agora",
      detail:
        "O sistema encontrou pelo menos um bloqueio objetivo. Resolva ou esclareça os pontos abaixo antes de transferir.",
      reasons: blockers,
    };
  }

  if (cautions.length > 0) {
    return {
      level: "review",
      title: "Revisar antes de aprovar",
      detail:
        "O saque está tecnicamente coberto, mas existem sinais que merecem conferência manual antes do Pix.",
      reasons: cautions,
    };
  }

  return {
    level: "approve",
    title: "Pode aprovar",
    detail:
      "A conciliação fecha e nenhum bloqueio ou sinal relevante foi encontrado nas verificações atuais.",
    reasons: [
      "saldo elegível cobre a solicitação",
      "chave Pix confere com a conta de recebimento",
      "não há bloqueio financeiro ou disputa aberta detectada",
    ],
  };
}

function buildSignals(
  risk: AdminWithdrawalRisk,
  payoutAccount: AdminWithdrawalPayoutAccount | null,
): Signal[] {
  const signals: Signal[] = [];
  const age = accountAgeDays(risk.accountCreatedAt);

  if (!risk.requestStillBacked) {
    signals.push({
      tone: "danger",
      title: "Saldo não cobre mais a solicitação",
      detail:
        "Os ganhos elegíveis atuais são menores que os saques já reservados. Não pague antes de reconciliar a conta.",
    });
  }

  if (risk.paymentSplitMismatchCount > 0) {
    signals.push({
      tone: "danger",
      title: "Inconsistência financeira detectada",
      detail: `${risk.paymentSplitMismatchCount} pagamento(s) não fecham bruto = taxa + criador.`,
    });
  }

  if (risk.selfPurchaseCount > 0) {
    signals.push({
      tone: "danger",
      title: "Compra do próprio criador",
      detail: `${risk.selfPurchaseCount} pagamento(s) têm comprador e criador iguais.`,
    });
  }

  if (risk.openDisputesCount > 0) {
    signals.push({
      tone: "warning",
      title: "Há disputa aberta",
      detail: `${risk.openDisputesCount} disputa(s) de serviço ainda não resolvida(s).`,
    });
  }

  if (risk.problemPaymentsCount > 0) {
    signals.push({
      tone: "warning",
      title: "Histórico de estorno ou chargeback",
      detail: `${risk.problemPaymentsCount} pagamento(s) problemático(s) no histórico.`,
    });
  }

  if (risk.pixKeyChanged) {
    signals.push({
      tone: "warning",
      title: "Chave Pix diferente da última paga",
      detail:
        "Confirme com atenção a identidade e a chave antes de transferir.",
    });
  }

  if (risk.verificationStatus !== "verified") {
    signals.push({
      tone: "warning",
      title: "Conta não verificada",
      detail: "O perfil ainda não possui status de verificação concluída.",
    });
  }

  if (age < 7) {
    signals.push({
      tone: "warning",
      title: "Conta recente",
      detail: `Conta criada há ${age} dia(s).`,
    });
  }

  if (
    risk.paidSalesCount >= 2 &&
    risk.largestBuyerSharePercent >= 80
  ) {
    signals.push({
      tone: "warning",
      title: "Receita muito concentrada em um comprador",
      detail: `O maior comprador representa ${risk.largestBuyerSharePercent.toFixed(1)}% dos ganhos pagos.`,
    });
  }

  if (
    risk.currentEarnedCents > 0 &&
    risk.paidSalesCount >= 2 &&
    risk.earningsLast24hCents / risk.currentEarnedCents >= 0.8
  ) {
    signals.push({
      tone: "warning",
      title: "Crescimento muito recente",
      detail: "Mais de 80% dos ganhos confirmados entraram nas últimas 24 horas.",
    });
  }

  if (risk.rejectedWithdrawalsCount > 0) {
    signals.push({
      tone: "info",
      title: "Já houve saque recusado",
      detail: `${risk.rejectedWithdrawalsCount} solicitação(ões) anterior(es) foram recusadas.`,
    });
  }

  if (risk.firstWithdrawal) {
    signals.push({
      tone: "info",
      title: "Primeiro saque",
      detail: "Não existe histórico anterior de retirada para comparar.",
    });
  }

  if (risk.currentPendingReleaseCents > 0) {
    signals.push({
      tone: "info",
      title: "Há saldo ainda não liberado",
      detail: `${formatBRL(risk.currentPendingReleaseCents)} está ligado a ganhos que ainda não cumprem a regra de saque.`,
    });
  }

  if (
    risk.requestStillBacked &&
    risk.paymentSplitMismatchCount === 0 &&
    risk.selfPurchaseCount === 0
  ) {
    signals.push({
      tone: "positive",
      title: "Solicitação coberta pelo saldo elegível",
      detail: "A conciliação atual suporta o valor reservado para este saque.",
    });
  }

  return signals;
}

const SIGNAL_CLASSES: Record<SignalTone, string> = {
  danger: "border-(--color-danger) text-(--color-danger)",
  warning: "border-(--color-border) text-(--color-warning)",
  info: "border-(--color-border) text-(--color-text-muted)",
  positive: "border-(--color-border) text-(--color-accent-text)",
};

export function AdminWithdrawalDossier({
  withdrawal,
  onClose,
  onReview,
}: {
  withdrawal: AdminWithdrawalRow;
  onClose: () => void;
  onReview: (status: "paid" | "rejected") => void;
}) {
  const [risk, setRisk] = useState<AdminWithdrawalRisk | null>(null);
  const [payoutAccount, setPayoutAccount] =
    useState<AdminWithdrawalPayoutAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setRisk(null);
    setPayoutAccount(null);
    setError(null);

    const supabase = createClient();
    Promise.all([
      getAdminWithdrawalRisk(supabase, withdrawal.id),
      getAdminWithdrawalPayoutAccount(supabase, withdrawal.id),
    ])
      .then(([riskData, payoutData]) => {
        if (active) {
          setRisk(riskData);
          setPayoutAccount(payoutData);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível montar o dossiê deste saque.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [withdrawal.id]);

  const signals = useMemo(
    () => (risk ? buildSignals(risk, payoutAccount) : []),
    [risk, payoutAccount],
  );
  const recommendation = useMemo(
    () => (risk ? buildRecommendation(risk, payoutAccount) : null),
    [risk, payoutAccount],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        aria-label="Fechar detalhes do saque"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <section className="relative max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-(--color-border) bg-(--color-surface) px-4 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-subtle)">
              Revisão de saque
            </p>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <h2 className="truncate text-lg font-bold text-(--color-text)">
                {withdrawal.creatorDisplayName ??
                  withdrawal.creatorUsername ??
                  "Criador"}
              </h2>
              <StatusBadge status={withdrawal.status} />
            </div>
            <p className="mt-1 text-sm font-bold text-(--color-text)">
              {formatBRL(withdrawal.amountCents)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-(--color-border) text-(--color-text-muted)"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={1.7} />
          </button>
        </header>

        <div className="flex flex-col gap-5 p-4">
          {error ? (
            <div className="rounded-xl border border-(--color-danger) px-3 py-3 text-sm text-(--color-danger)">
              {error}
            </div>
          ) : null}

          {!risk && !error ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-(--color-text-muted)">
              <Loader2 size={16} className="animate-spin" strokeWidth={1.6} />
              Conferindo saldo, vendas e histórico…
            </div>
          ) : null}

          {risk ? (
            <>
              {recommendation ? (
                <section
                  className={`rounded-2xl border px-4 py-4 ${
                    recommendation.level === "hold"
                      ? "border-(--color-danger) bg-(--color-surface-2)"
                      : recommendation.level === "review"
                        ? "border-(--color-warning) bg-(--color-surface-2)"
                        : "border-(--color-border) bg-(--color-surface-2)"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-subtle)">
                    Recomendação do sistema
                  </p>
                  <h3
                    className={`mt-1 text-lg font-bold ${
                      recommendation.level === "hold"
                        ? "text-(--color-danger)"
                        : recommendation.level === "review"
                          ? "text-(--color-warning)"
                          : "text-(--color-accent-text)"
                    }`}
                  >
                    {recommendation.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-(--color-text-muted)">
                    {recommendation.detail}
                  </p>
                  <div className="mt-3 flex flex-col gap-1.5">
                    {recommendation.reasons.map((reason) => (
                      <div
                        key={reason}
                        className="flex items-start gap-2 text-xs text-(--color-text)"
                      >
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-(--color-text-subtle)">
                    A recomendação é apoio à revisão manual e não substitui sua
                    conferência do Pix e do histórico.
                  </p>
                </section>
              ) : null}

              <section>
                <h3 className="text-sm font-semibold text-(--color-text)">
                  Sinais para revisar
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-(--color-text-muted)">
                  Estes sinais ajudam na análise manual. Isoladamente, não provam fraude.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {signals.map((signal, index) => (
                    <div
                      key={`${signal.title}-${index}`}
                      className={`rounded-xl border px-3 py-3 ${SIGNAL_CLASSES[signal.tone]}`}
                    >
                      <div className="flex items-start gap-2">
                        {signal.tone === "positive" ? (
                          <CheckCircle2 size={15} className="mt-0.5 shrink-0" strokeWidth={1.8} />
                        ) : signal.tone === "info" ? (
                          <Clock3 size={15} className="mt-0.5 shrink-0" strokeWidth={1.8} />
                        ) : (
                          <AlertTriangle size={15} className="mt-0.5 shrink-0" strokeWidth={1.8} />
                        )}
                        <div>
                          <p className="text-xs font-semibold">{signal.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed opacity-80">
                            {signal.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-(--color-text)">
                  Conciliação do saldo
                </h3>
                <div className="mt-3 overflow-hidden rounded-xl border border-(--color-border)">
                  <MoneyRow label="Total confirmado" value={risk.currentEarnedCents} />
                  <MoneyRow label="Elegível para saque" value={risk.currentEligibleCents} />
                  <MoneyRow label="A liberar" value={risk.currentPendingReleaseCents} />
                  <MoneyRow label="Saques reservados/pagos" value={risk.currentReservedCents} />
                  <MoneyRow label="Já transferido" value={risk.currentWithdrawnCents} />
                  <MoneyRow label="Disponível após reservas" value={risk.currentAvailableCents} strong />
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs">
                  <ShieldCheck
                    size={14}
                    strokeWidth={1.8}
                    className={
                      risk.requestStillBacked
                        ? "text-(--color-accent-text)"
                        : "text-(--color-danger)"
                    }
                  />
                  <span
                    className={
                      risk.requestStillBacked
                        ? "text-(--color-text-muted)"
                        : "font-semibold text-(--color-danger)"
                    }
                  >
                    {risk.requestStillBacked
                      ? "O pedido continua coberto pelo saldo elegível."
                      : "O pedido não está totalmente coberto pelo saldo elegível atual."}
                  </span>
                </div>

                {risk.snapshotAvailableBeforeCents !== null ? (
                  <p className="mt-2 text-[11px] text-(--color-text-subtle)">
                    No momento da solicitação havia{" "}
                    {formatBRL(risk.snapshotAvailableBeforeCents)} disponível antes de reservar este saque.
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-(--color-text-subtle)">
                    Esta solicitação é anterior ao registro de snapshots financeiros.
                  </p>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-(--color-text)">
                  Histórico operacional
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Metric label="Vendas pagas" value={risk.paidSalesCount} />
                  <Metric label="Produtos" value={risk.productSalesCount} />
                  <Metric label="Serviços pagos" value={risk.serviceSalesCount} />
                  <Metric label="Serviços concluídos" value={risk.completedServicesCount} />
                  <Metric label="Serviços em aberto" value={risk.openServiceOrdersCount} />
                  <Metric label="Compradores únicos" value={risk.uniqueBuyersCount} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Metric
                    label="Maior comprador"
                    value={`${risk.largestBuyerSharePercent.toFixed(1)}%`}
                  />
                  <Metric
                    label="Conta criada há"
                    value={`${accountAgeDays(risk.accountCreatedAt)} dias`}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-(--color-text)">
                  Conta Pix de recebimento
                </h3>
                <div className="mt-3 overflow-hidden rounded-xl border border-(--color-border)">
                  <TextRow label="Tipo do saque" value={risk.pixKeyType.toUpperCase()} />
                  <TextRow label="Chave do saque" value={risk.pixKey} breakAll />
                  <TextRow
                    label="Chave atual"
                    value={
                      payoutAccount
                        ? `${payoutAccount.currentPixKeyType.toUpperCase()} · ${payoutAccount.currentPixKey}`
                        : "Não cadastrada"
                    }
                    breakAll
                  />
                  <TextRow
                    label="Confere com o saque"
                    value={
                      payoutAccount?.matchesWithdrawal ? "Sim" : "Não"
                    }
                  />
                  <TextRow
                    label="Alterações de chave"
                    value={String(payoutAccount?.changeCount ?? 0)}
                  />
                  <TextRow
                    label="Período de segurança"
                    value={
                      payoutAccount?.inCooldown
                        ? `Até ${new Date(
                            payoutAccount.eligibleAfter,
                          ).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}`
                        : "Sem bloqueio"
                    }
                  />
                  <TextRow
                    label="Verificação da conta"
                    value={risk.verificationStatus === "verified" ? "Verificada" : "Não verificada"}
                  />
                </div>

                {payoutAccount && payoutAccount.history.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-(--color-text)">
                      Histórico recente da chave
                    </p>
                    <div className="mt-2 overflow-hidden rounded-xl border border-(--color-border)">
                      {payoutAccount.history.slice(0, 5).map((item, index) => (
                        <div
                          key={`${item.changed_at}-${index}`}
                          className="flex items-start justify-between gap-3 border-b border-(--color-border) px-3 py-2.5 last:border-b-0"
                        >
                          <div>
                            <p className="text-xs font-medium text-(--color-text)">
                              {item.event_type === "changed"
                                ? "Chave alterada"
                                : item.event_type === "created"
                                  ? "Chave cadastrada"
                                  : "Chave migrada"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-(--color-text-muted)">
                              {item.new_pix_key_type.toUpperCase()} · {maskPix(item.new_pix_key)}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] text-(--color-text-subtle)">
                            {new Date(item.changed_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-(--color-text)">
                  Últimas vendas
                </h3>
                {risk.recentSales.length === 0 ? (
                  <p className="mt-2 text-xs text-(--color-text-muted)">Sem vendas registradas.</p>
                ) : (
                  <div className="mt-3 overflow-hidden rounded-xl border border-(--color-border)">
                    {risk.recentSales.slice(0, 6).map((sale, index) => (
                      <div
                        key={`${sale.confirmed_at}-${index}`}
                        className="flex items-start justify-between gap-3 border-b border-(--color-border) px-3 py-3 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-(--color-text)">
                            {sale.buyer_name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-(--color-text-muted)">
                            {sale.kind === "product" ? "Produto" : "Serviço"}
                            {sale.service_status ? ` · ${sale.service_status}` : ""}
                            {" · "}
                            {new Date(sale.confirmed_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <strong className="shrink-0 text-xs text-(--color-text)">
                          {formatBRL(sale.creator_amount_cents)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-(--color-text)">
                  Histórico de saques
                </h3>
                {risk.recentWithdrawals.length === 0 ? (
                  <p className="mt-2 text-xs text-(--color-text-muted)">Nenhum saque anterior.</p>
                ) : (
                  <div className="mt-3 overflow-hidden rounded-xl border border-(--color-border)">
                    {risk.recentWithdrawals.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 border-b border-(--color-border) px-3 py-3 last:border-b-0"
                      >
                        <div>
                          <p className="text-xs font-semibold text-(--color-text)">
                            {formatBRL(item.amount_cents)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-(--color-text-muted)">
                            {item.pix_key_type.toUpperCase()} · {maskPix(item.pix_key)}
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={item.status} />
                          <p className="mt-1 text-[10px] text-(--color-text-subtle)">
                            {new Date(item.requested_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>

        {risk && withdrawal.status === "requested" ? (
          <footer className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-(--color-border) bg-(--color-surface) p-4">
            <button
              type="button"
              onClick={() => onReview("rejected")}
              className="min-h-11 rounded-full border border-(--color-border) px-4 py-2.5 text-sm font-semibold text-(--color-text)"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => onReview("paid")}
              className="min-h-11 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent)"
            >
              Marcar pago
            </button>
          </footer>
        ) : null}
      </section>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-(--color-border) px-3 py-2.5 last:border-b-0">
      <span className="text-xs text-(--color-text-muted)">{label}</span>
      <strong className={strong ? "text-sm text-(--color-text)" : "text-xs text-(--color-text)"}>
        {formatBRL(value)}
      </strong>
    </div>
  );
}

function TextRow({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-(--color-border) px-3 py-2.5 last:border-b-0">
      <span className="shrink-0 text-xs text-(--color-text-muted)">{label}</span>
      <strong className={`min-w-0 text-right text-xs text-(--color-text) ${breakAll ? "break-all" : ""}`}>
        {value}
      </strong>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-3">
      <p className="text-[10px] leading-tight text-(--color-text-subtle)">{label}</p>
      <p className="mt-1 text-base font-bold text-(--color-text)">{value}</p>
    </div>
  );
}
