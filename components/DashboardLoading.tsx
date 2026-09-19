import { Loader2 } from "lucide-react";

/**
 * Estado de carregamento das páginas do painel que buscam dados no
 * próprio mount (client-side) — sem isso, a página ficava em branco
 * (`return null`) entre o clique no card do hub e os dados chegarem, o
 * que lê como travado mesmo quando a busca é rápida. Mesmo padrão já
 * usado em /dashboard/carteira.
 */
export function DashboardLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-(--color-text-muted)">
      <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
      Carregando…
    </div>
  );
}
