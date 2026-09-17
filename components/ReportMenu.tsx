"use client";

import { useState } from "react";
import { MoreHorizontal, Flag } from "lucide-react";
import { REPORT_REASON_LABELS, type ReportReason } from "@/lib/types";

export function ReportMenu({
  onReport,
  bare = false,
}: {
  onReport?: (reason: ReportReason) => void;
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

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
              {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((reason) => (
                <button
                  key={reason}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    onReport?.(reason);
                    setSent(true);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-(--color-text) hover:bg-(--color-surface)"
                >
                  {REPORT_REASON_LABELS[reason]}
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
