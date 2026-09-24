import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";

export default function DashboardCuponsPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Vendas"
        title="Cupons"
        description="Essa ferramenta ainda não está ativa no Jobê. Preferimos não mostrar dados de exemplo como se fossem cupons reais."
      />

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--color-surface-2)">
          <Ticket size={20} className="text-(--color-accent-text)" strokeWidth={1.7} />
        </span>
        <div>
          <p className="font-semibold text-(--color-text)">Cupons entram depois</p>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-(--color-text-muted)">
            Quando essa função estiver ligada ao banco e ao checkout de verdade, ela volta para a navegação do painel.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-accent-text) hover:underline"
        >
          Voltar para a visão geral
          <ArrowRight size={14} strokeWidth={1.7} />
        </Link>
      </div>
    </div>
  );
}
