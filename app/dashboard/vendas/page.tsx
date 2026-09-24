import Link from "next/link";
import { Receipt } from "lucide-react";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { StatCard } from "@/components/StatCard";
import { getCurrentUser } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  getCreatorSalesSummary,
  listCreatorSalesPage,
} from "@/lib/supabase/dashboard";

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type SaleFilter = "all" | "product" | "custom_service";
const PAGE_SIZE = 25;

export default async function DashboardVendasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string; pagina?: string }>;
}) {
  const creator = await getCurrentUser();
  if (!creator?.creatorProfile) return null;

  const params = await searchParams;
  const filter: SaleFilter =
    params.tipo === "product" || params.tipo === "custom_service" ? params.tipo : "all";
  const query = (params.q ?? "").trim();
  const requestedPage = Number.parseInt(params.pagina ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const supabase = await createServerClient();
  const [summary, salesPage] = await Promise.all([
    getCreatorSalesSummary(supabase),
    listCreatorSalesPage(supabase, {
      kind: filter === "all" ? undefined : filter,
      query,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
  ]);

  const average = summary.totalSales
    ? Math.round(summary.creatorAmountCents / summary.totalSales)
    : 0;
  const totalPages = Math.max(1, Math.ceil(salesPage.totalCount / PAGE_SIZE));

  function hrefFor(next: { filter?: SaleFilter; page?: number }) {
    const search = new URLSearchParams();
    const nextFilter = next.filter ?? filter;
    const nextPage = next.page ?? 1;
    if (nextFilter !== "all") search.set("tipo", nextFilter);
    if (query) search.set("q", query);
    if (nextPage > 1) search.set("pagina", String(nextPage));
    const suffix = search.toString();
    return `/dashboard/vendas${suffix ? `?${suffix}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Dinheiro"
        title="Vendas"
        description="Só entram aqui pagamentos realmente confirmados. O valor recebido já desconta a parte do Jobê."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Você recebeu" value={formatBRL(summary.creatorAmountCents)} icon={Receipt} />
        <StatCard label="Total pago pelos clientes" value={formatBRL(summary.grossAmountCents)} />
        <StatCard label="Média por venda" value={formatBRL(average)} hint={`${summary.totalSales} confirmada(s)`} />
      </div>

      <section className="flex flex-col gap-3">
        <form method="get" action="/dashboard/vendas" className="flex gap-2">
          {filter !== "all" ? <input type="hidden" name="tipo" value={filter} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar venda ou cliente"
            aria-label="Buscar venda ou cliente"
            className="min-w-0 flex-1 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-base text-(--color-text) outline-none placeholder:text-(--color-text-subtle) focus:border-(--color-accent-text) sm:text-sm"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm font-medium text-(--color-text) hover:bg-(--color-surface-2)"
          >
            Buscar
          </button>
        </form>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {([
            ["all", "Todas"],
            ["product", "Produtos"],
            ["custom_service", "Serviços"],
          ] as const).map(([value, label]) => (
            <Link
              key={value}
              href={hrefFor({ filter: value, page: 1 })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === value
                  ? "border-(--color-contrast) bg-(--color-contrast) text-(--color-on-contrast)"
                  : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted)"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {summary.totalSales === 0 ? (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-5 py-10 text-center">
          <p className="font-semibold text-(--color-text)">Nenhuma venda confirmada ainda</p>
          <p className="mt-1 text-sm text-(--color-text-muted)">Quando um pagamento for aprovado, ele aparece aqui.</p>
        </div>
      ) : salesPage.items.length === 0 ? (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-5 py-9 text-center">
          <p className="font-semibold text-(--color-text)">Nenhuma venda encontrada</p>
          <p className="mt-1 text-sm text-(--color-text-muted)">Tente outro nome, filtro ou página.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-(--color-text-subtle)">
              {salesPage.totalCount} {salesPage.totalCount === 1 ? "resultado" : "resultados"}
            </p>
            {query || filter !== "all" ? (
              <Link href="/dashboard/vendas" className="text-xs font-medium text-(--color-accent-text) hover:underline">
                Limpar filtros
              </Link>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {salesPage.items.map((sale) => (
              <article key={sale.id} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-(--color-text)">{sale.title}</p>
                    <p className="mt-1 truncate text-xs text-(--color-text-muted)">{sale.buyerName}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-(--color-text)">{formatBRL(sale.creatorAmountCents)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-(--color-border) pt-3 text-xs text-(--color-text-subtle)">
                  <span>{sale.kind === "product" ? "Produto" : "Serviço"}</span>
                  <span>{new Date(sale.confirmedAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-subtle)">
                  <th className="px-4 py-3 font-medium">Venda</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 text-right font-medium">Você recebeu</th>
                </tr>
              </thead>
              <tbody>
                {salesPage.items.map((sale) => (
                  <tr key={sale.id} className="border-b border-(--color-border) last:border-0">
                    <td className="max-w-64 px-4 py-3 font-medium text-(--color-text)">{sale.title}</td>
                    <td className="px-4 py-3 text-(--color-text-muted)">{sale.buyerName}</td>
                    <td className="px-4 py-3 text-(--color-text-muted)">{sale.kind === "product" ? "Produto" : "Serviço"}</td>
                    <td className="px-4 py-3 text-(--color-text-muted)">{new Date(sale.confirmedAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right font-semibold text-(--color-text)">{formatBRL(sale.creatorAmountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <nav className="flex items-center justify-between gap-3" aria-label="Paginação das vendas">
              <Link
                href={hrefFor({ page: Math.max(1, page - 1) })}
                aria-disabled={page <= 1}
                className={`rounded-full border border-(--color-border) px-4 py-2 text-sm ${
                  page <= 1 ? "pointer-events-none opacity-40" : "text-(--color-text) hover:bg-(--color-surface-2)"
                }`}
              >
                Anterior
              </Link>
              <span className="text-xs text-(--color-text-subtle)">
                Página {Math.min(page, totalPages)} de {totalPages}
              </span>
              <Link
                href={hrefFor({ page: Math.min(totalPages, page + 1) })}
                aria-disabled={page >= totalPages}
                className={`rounded-full border border-(--color-border) px-4 py-2 text-sm ${
                  page >= totalPages ? "pointer-events-none opacity-40" : "text-(--color-text) hover:bg-(--color-surface-2)"
                }`}
              >
                Próxima
              </Link>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
