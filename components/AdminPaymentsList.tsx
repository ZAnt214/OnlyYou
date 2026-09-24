"use client";

import { useMemo, useState } from "react";
import { ChevronRight, CreditCard } from "lucide-react";
import type { AdminPaymentConfirmationRow } from "@/lib/payments/adminPaymentConfirmations";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Estornado",
  chargeback: "Chargeback",
};

const FILTERS = [
  ["all", "Todos"],
  ["paid", "Pagos"],
  ["pending", "Pendentes"],
  ["failed", "Falhas"],
  ["refunded", "Estornos"],
] as const;

export function AdminPaymentsList({
  payments,
}: {
  payments: AdminPaymentConfirmationRow[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [selected, setSelected] = useState<AdminPaymentConfirmationRow | null>(null);

  const counts = useMemo(
    () => ({
      all: payments.length,
      paid: payments.filter((p) => p.status === "paid").length,
      pending: payments.filter((p) => p.status === "pending" || p.status === "processing").length,
      failed: payments.filter((p) => p.status === "failed" || p.status === "chargeback").length,
      refunded: payments.filter((p) => p.status === "refunded").length,
    }),
    [payments],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const statusMatches =
        filter === "all" ||
        (filter === "pending"
          ? payment.status === "pending" || payment.status === "processing"
          : filter === "failed"
            ? payment.status === "failed" || payment.status === "chargeback"
            : payment.status === filter);

      if (!statusMatches) return false;
      if (!term) return true;

      return [
        payment.orderId,
        payment.mpPaymentId,
        payment.buyerUsername ?? "",
        payment.creatorUsername ?? "",
        payment.method ?? "",
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [filter, payments, query]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pedido, pagamento ou usuário"
          className="min-h-11 rounded-xl border border-(--color-border) bg-(--color-surface) px-3.5 py-2.5 text-base text-(--color-text) outline-none placeholder:text-(--color-text-subtle) focus:border-(--color-accent-text) sm:text-sm"
        />

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(([id, label]) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "border-(--color-text) bg-(--color-text) text-(--color-bg)"
                    : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted)"
                }`}
              >
                {label}
                <span className={active ? "opacity-70" : "text-(--color-text-subtle)"}>
                  {counts[id]}
                </span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-(--color-border) px-5 py-9 text-center">
            <p className="font-semibold text-(--color-text)">Nenhum pagamento encontrado</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
            {visible.map((payment) => (
              <button
                key={payment.mpPaymentId}
                type="button"
                onClick={() => setSelected(payment)}
                className="flex w-full items-center gap-3 border-b border-(--color-border) px-4 py-3 text-left last:border-b-0 hover:bg-(--color-surface-2)"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-(--color-surface-2) text-(--color-text-muted)">
                  <CreditCard size={16} strokeWidth={1.7} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold text-(--color-text)">
                      {payment.buyerUsername ?? "Comprador"}
                      <span className="mx-1.5 font-normal text-(--color-text-subtle)">→</span>
                      {payment.creatorUsername ?? "Criador"}
                    </p>
                    <PaymentStatus status={payment.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-(--color-text-muted)">
                    {payment.kind === "product" ? "Produto" : "Serviço"} · {payment.method ?? "Método não informado"}
                  </p>
                  <p className="mt-1 text-[10px] text-(--color-text-subtle)">
                    {new Date(payment.confirmedAt ?? payment.createdAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-(--color-text)">
                    {formatBRLFromCents(payment.grossAmountCents)}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-(--color-accent-text)">
                    Ver <ChevronRight size={13} strokeWidth={1.8} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Fechar pagamento"
            onClick={() => setSelected(null)}
            className="absolute inset-0 bg-black/55"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-subtle)">
                  Detalhes do pagamento
                </p>
                <h2 className="mt-1 text-xl font-bold text-(--color-text)">
                  {formatBRLFromCents(selected.grossAmountCents)}
                </h2>
              </div>
              <PaymentStatus status={selected.status} />
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-(--color-border)">
              <Detail label="Comprador" value={selected.buyerUsername ?? "—"} />
              <Detail label="Criador" value={selected.creatorUsername ?? "—"} />
              <Detail label="Tipo" value={selected.kind === "product" ? "Produto" : "Serviço personalizado"} />
              <Detail label="Método" value={selected.method ?? "—"} />
              <Detail label="Pedido" value={selected.orderId} />
              <Detail label="Payment ID" value={selected.mpPaymentId} />
              <Detail label="Pago pelo cliente" value={formatBRLFromCents(selected.grossAmountCents)} />
              <Detail label="Receita Jobê" value={formatBRLFromCents(selected.platformFeeCents)} />
              <Detail label="Criador recebe" value={formatBRLFromCents(selected.creatorAmountCents)} />
              <Detail
                label="Data"
                value={new Date(selected.confirmedAt ?? selected.createdAt).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              />
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-5 min-h-11 w-full rounded-full border border-(--color-border) px-4 py-2.5 text-sm font-medium text-(--color-text)"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PaymentStatus({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status;
  const className =
    status === "paid"
      ? "text-(--color-success)"
      : status === "failed" || status === "chargeback"
        ? "text-(--color-danger)"
        : status === "pending" || status === "processing"
          ? "text-(--color-warning)"
          : "text-(--color-text-muted)";

  return (
    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-(--color-border) px-3 py-3 last:border-b-0">
      <span className="shrink-0 text-xs text-(--color-text-muted)">{label}</span>
      <strong className="min-w-0 break-all text-right text-xs text-(--color-text)">
        {value}
      </strong>
    </div>
  );
}
