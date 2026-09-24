import { BarChart3, Package, Star, TrendingUp } from "lucide-react";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { StatCard } from "@/components/StatCard";
import { getCurrentUser } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { listProductsForCreator } from "@/lib/supabase/products";
import { listCreatorSales } from "@/lib/supabase/dashboard";

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardEstatisticasPage() {
  const creator = await getCurrentUser();
  if (!creator?.creatorProfile) return null;

  const supabase = await createServerClient();
  const [products, sales] = await Promise.all([
    listProductsForCreator(supabase, creator.id),
    listCreatorSales(supabase, creator.id),
  ]);

  const netTotal = sales.reduce((sum, sale) => sum + sale.creatorAmountCents, 0);
  const average = sales.length ? Math.round(netTotal / sales.length) : 0;
  const published = products.filter((product) => product.status === "approved");

  const monthlyMap = new Map<string, { label: string; total: number }>();
  for (const sale of sales) {
    const date = new Date(sale.confirmedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = monthlyMap.get(key) ?? {
      label: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""),
      total: 0,
    };
    current.total += sale.creatorAmountCents;
    monthlyMap.set(key, current);
  }
  const months = [...monthlyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  const maxMonthly = Math.max(1, ...months.map(([, value]) => value.total));
  const maxProductSales = Math.max(1, ...published.map((product) => product.salesCount));

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Desempenho"
        title="Estatísticas"
        description="Números reais de vendas confirmadas e do que você já publicou no Jobê."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Receita líquida" value={formatBRL(netTotal)} icon={TrendingUp} />
        <StatCard label="Média por venda" value={formatBRL(average)} icon={BarChart3} />
        <StatCard
          label="Sua avaliação"
          value={creator.creatorProfile.ratingCount > 0 ? creator.creatorProfile.rating.toFixed(1) : "—"}
          icon={Star}
          hint={creator.creatorProfile.ratingCount > 0 ? `${creator.creatorProfile.ratingCount} avaliação(ões)` : "Ainda sem avaliações"}
        />
        <StatCard label="Produtos publicados" value={String(published.length)} icon={Package} />
      </div>

      <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-(--color-text)">Recebido ao longo do tempo</h2>
          <p className="mt-0.5 text-xs text-(--color-text-muted)">Últimos meses com venda confirmada.</p>
        </div>

        {months.length === 0 ? (
          <p className="mt-6 text-sm text-(--color-text-muted)">Ainda não há vendas para montar o gráfico.</p>
        ) : (
          <div className="no-scrollbar mt-5 flex min-h-44 items-end gap-3 overflow-x-auto pb-1">
            {months.map(([key, item]) => (
              <div key={key} className="flex min-w-14 flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-medium text-(--color-text-subtle)">{formatBRL(item.total)}</span>
                <div className="flex h-28 w-full items-end justify-center rounded-xl bg-(--color-surface-2) px-2 pt-2">
                  <div
                    className="w-full max-w-10 rounded-t-lg bg-(--color-accent)"
                    style={{ height: `${Math.max(8, (item.total / maxMonthly) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] capitalize text-(--color-text-subtle)">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
        <h2 className="text-base font-semibold text-(--color-text)">Produtos com mais vendas</h2>
        <p className="mt-0.5 text-xs text-(--color-text-muted)">Contagem registrada no catálogo.</p>

        {published.length === 0 ? (
          <p className="mt-6 text-sm text-(--color-text-muted)">Você ainda não publicou produtos.</p>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {[...published]
              .sort((a, b) => b.salesCount - a.salesCount)
              .slice(0, 8)
              .map((product) => (
                <div key={product.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-(--color-text)">{product.title}</span>
                    <span className="shrink-0 text-xs text-(--color-text-subtle)">{product.salesCount} venda(s)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-(--color-surface-2)">
                    <div
                      className="h-full rounded-full bg-(--color-accent)"
                      style={{ width: `${(product.salesCount / maxProductSales) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
