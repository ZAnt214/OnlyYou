import { Receipt } from "lucide-react";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { StatCard } from "@/components/StatCard";
import { getCurrentUser } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { listCreatorSales } from "@/lib/supabase/dashboard";

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardVendasPage() {
  const creator = await getCurrentUser();
  if (!creator?.creatorProfile) return null;

  const supabase = await createServerClient();
  const sales = await listCreatorSales(supabase, creator.id);
  const netTotal = sales.reduce((sum, sale) => sum + sale.creatorAmountCents, 0);
  const grossTotal = sales.reduce((sum, sale) => sum + sale.grossAmountCents, 0);
  const average = sales.length ? Math.round(netTotal / sales.length) : 0;

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Dinheiro"
        title="Vendas"
        description="Só entram aqui pagamentos realmente confirmados. O valor mostrado como recebido já desconta a parte do Jobê."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Você recebeu" value={formatBRL(netTotal)} icon={Receipt} />
        <StatCard label="Total pago pelos clientes" value={formatBRL(grossTotal)} />
        <StatCard label="Média por venda" value={formatBRL(average)} hint={`${sales.length} confirmada(s)`} />
      </div>

      {sales.length === 0 ? (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-5 py-10 text-center">
          <p className="font-semibold text-(--color-text)">Nenhuma venda confirmada ainda</p>
          <p className="mt-1 text-sm text-(--color-text-muted)">Quando um pagamento for aprovado, ele aparece aqui.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {sales.map((sale) => (
              <article key={sale.id} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-(--color-text)">{sale.title}</p>
                    <p className="mt-1 text-xs text-(--color-text-muted)">{sale.buyerName}</p>
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
                {sales.map((sale) => (
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
        </>
      )}
    </div>
  );
}
