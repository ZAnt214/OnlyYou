"use client";

import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-start gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-surface-2)">
        <AlertCircle size={19} className="text-(--color-accent-text)" strokeWidth={1.7} />
      </span>

      <div>
        <h1 className="text-lg font-semibold text-(--color-text)">Algo não carregou direito</h1>
        <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">
          Pode ter sido uma falha rápida de conexão ou do servidor. Você pode tentar de novo sem sair do painel.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
        >
          <RotateCcw size={14} strokeWidth={1.7} />
          Tentar de novo
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center rounded-full border border-(--color-border) px-4 py-2.5 text-sm font-medium text-(--color-text) hover:bg-(--color-surface-2)"
        >
          Visão geral
        </Link>
      </div>
    </div>
  );
}
