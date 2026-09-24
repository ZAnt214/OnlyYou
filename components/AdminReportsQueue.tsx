"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reviewReport } from "@/lib/supabase/reports";
import { StatusBadge } from "@/components/StatusBadge";
import {
  REPORT_REASON_LABELS,
  type Report,
  type ReportPriority,
  type ReportStatus,
} from "@/lib/types";

type Filter = ReportStatus | "all";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "open", label: "Abertas" },
  { id: "under_review", label: "Em análise" },
  { id: "resolved", label: "Resolvidas" },
  { id: "dismissed", label: "Arquivadas" },
  { id: "all", label: "Todas" },
];

const PRIORITY_LABELS: Record<ReportPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const PRIORITY_WEIGHT: Record<ReportPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};

function targetLabel(report: Report) {
  if (report.targetType === "product") return "Produto";
  if (report.targetType === "user") return "Usuário";
  if (report.targetType === "message") return "Mensagem";
  return "Conversa";
}

export function AdminReportsQueue({
  initialReports,
}: {
  initialReports: Report[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<Filter>("open");
  const [selected, setSelected] = useState<Report | null>(null);
  const [decision, setDecision] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      open: reports.filter((r) => r.status === "open").length,
      under_review: reports.filter((r) => r.status === "under_review").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
      dismissed: reports.filter((r) => r.status === "dismissed").length,
      all: reports.length,
    }),
    [reports],
  );

  const visible = useMemo(() => {
    const items = filter === "all" ? reports : reports.filter((r) => r.status === filter);
    return [...items].sort((a, b) => {
      const priority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (priority !== 0) return priority;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [filter, reports]);

  async function updateStatus(status: ReportStatus) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await reviewReport(createClient(), {
        reportId: selected.id,
        status,
        decision: decision.trim() || undefined,
      });
      setReports((current) =>
        current.map((report) => (report.id === updated.id ? updated : report)),
      );
      setSelected(null);
      setDecision("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a denúncia.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
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

        {error ? (
          <p className="rounded-xl border border-(--color-danger) px-3 py-2 text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-(--color-border) px-5 py-9 text-center">
            <p className="font-semibold text-(--color-text)">Nenhuma denúncia nesta fila</p>
            <p className="mt-1 text-sm text-(--color-text-muted)">
              Novas ocorrências aparecem aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
            {visible.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => {
                  setSelected(report);
                  setDecision(report.decision ?? "");
                  setError(null);
                }}
                className="flex w-full items-center gap-3 border-b border-(--color-border) px-4 py-3 text-left last:border-b-0 hover:bg-(--color-surface-2)"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-(--color-surface-2)">
                  <AlertTriangle size={16} strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold text-(--color-text)">
                      {REPORT_REASON_LABELS[report.reason]}
                    </p>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-(--color-text-subtle)">
                      {PRIORITY_LABELS[report.priority]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-(--color-text-muted)">
                    {targetLabel(report)} · {report.targetId}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusBadge status={report.status} />
                  <span className="mt-1 flex items-center justify-end gap-0.5 text-[11px] font-medium text-(--color-accent-text)">
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
            aria-label="Fechar denúncia"
            disabled={busy}
            onClick={() => setSelected(null)}
            className="absolute inset-0 bg-black/55"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-subtle)">
                  Denúncia · {PRIORITY_LABELS[selected.priority]}
                </p>
                <h2 className="mt-1 text-lg font-bold text-(--color-text)">
                  {REPORT_REASON_LABELS[selected.reason]}
                </h2>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-(--color-border)">
              <Detail label="Alvo" value={`${targetLabel(selected)} · ${selected.targetId}`} />
              <Detail
                label="Recebida"
                value={new Date(selected.createdAt).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              />
              <Detail label="Relato" value={selected.description} />
            </div>

            <label className="mt-4 flex flex-col gap-1.5 text-sm text-(--color-text)">
              Nota administrativa
              <textarea
                value={decision}
                onChange={(event) => setDecision(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Opcional: registre o motivo da decisão."
                className="resize-none rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base outline-none focus:border-(--color-accent-text) sm:text-sm"
              />
            </label>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {selected.status !== "open" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void updateStatus("open")}
                  className="min-h-10 rounded-full border border-(--color-border) px-3.5 py-2 text-xs font-semibold text-(--color-text)"
                >
                  Reabrir
                </button>
              ) : null}
              {selected.status !== "under_review" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void updateStatus("under_review")}
                  className="min-h-10 rounded-full border border-(--color-border) px-3.5 py-2 text-xs font-semibold text-(--color-text)"
                >
                  Em análise
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateStatus("dismissed")}
                className="min-h-10 rounded-full border border-(--color-border) px-3.5 py-2 text-xs font-semibold text-(--color-text)"
              >
                Arquivar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateStatus("resolved")}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2 text-xs font-semibold text-(--color-on-accent)"
              >
                {busy ? <Loader2 size={13} className="animate-spin" strokeWidth={1.6} /> : null}
                Resolver
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-(--color-border) px-3 py-3 last:border-b-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-(--color-text)">{value}</p>
    </div>
  );
}
