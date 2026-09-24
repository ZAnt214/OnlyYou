"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-64 items-center justify-center py-8">
      <div className="flex w-full max-w-md flex-col items-start gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-surface-2)">
          <AlertTriangle size={18} className="text-(--color-accent-text)" strokeWidth={1.7} />
        </span>

        <div>
          <h2 className="font-semibold text-(--color-text)">Não foi possível abrir esta parte do painel</h2>
          <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">
            Tente carregar novamente. Se continuar acontecendo, suas informações continuam salvas.
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
        >
          <RotateCcw size={14} strokeWidth={1.7} />
          Tentar de novo
        </button>

        {error.digest ? (
          <p className="text-[11px] text-(--color-text-subtle)">Código: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
