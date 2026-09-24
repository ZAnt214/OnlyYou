"use client";

import { useState } from "react";
import { Loader2, MoreHorizontal, Flag } from "lucide-react";
import { REPORT_REASON_LABELS, type ReportReason } from "@/lib/types";

export function ReportMenu({
  onReport,
  bare = false,
}: {
  onReport?: (reason: ReportReason) => void | Promise<void>;
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState<ReportReason | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          bare
            ? "flex h-8 w-8 items-center justify-center rounded-full text-(--color-text-subtle) hover:bg-(--color-surface-2) hover:text-(--color-text)"
            : "flex h-8 w-8 items-center justify-center rounded-md border border-(--color-border) text-(--color-text-muted) hover:bg-(--color-surface)"
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mais opções"
      >
        <MoreHorizontal size={16} strokeWidth={1.5} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-64 rounded-md border border-(--color-border) bg-(--color-bg) py-1 shadow-sm"
        >
          {sent ? (
            <p className="px-3 py-2 text-sm text-(--color-text-muted)">
              Denúncia enviada. Nossa equipe vai analisar.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text-subtle)">
                <Flag size={12} strokeWidth={1.5} />
                Denunciar
              </div>
              {error ? (
                <p className="px-3 py-2 text-xs text-(--color-danger)">{error}</p>
              ) : null}
              {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((reason) => (
                <button
                  key={reason}
                  role="menuitem"
                  type="button"
                  disabled={sending !== null}
                  onClick={async () => {
                    setError(null);
                    setSending(reason);
                    try {
                      await onReport?.(reason);
                      setSent(true);
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Não foi possível enviar a denúncia.",
                      );
                    } finally {
                      setSending(null);
                    }
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-(--color-text) hover:bg-(--color-surface) disabled:opacity-60"
                >
                  <span>{REPORT_REASON_LABELS[reason]}</span>
                  {sending === reason ? (
                    <Loader2 size={13} className="animate-spin" strokeWidth={1.6} />
                  ) : null}
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
