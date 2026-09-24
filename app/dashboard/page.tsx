import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BriefcaseBusiness,
  MessageSquare,
  PackagePlus,
  Receipt,
  Store,
  Wallet,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { StatCard } from "@/components/StatCard";
import { getCurrentUser } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { listProductsForCreator } from "@/lib/supabase/products";
import { getCreatorBalance } from "@/lib/supabase/wallet";
import { getCreatorWorkSummary, listCreatorSales } from "@/lib/supabase/dashboard";

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDeadline(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardOverviewPage() {
  const creator = await getCurrentUser();
  if (!creator?.creatorProfile) return null;

  const supabase = await createServerClient();
  const [products, balance, sales, work] = await Promise.all([
    listProductsForCreator(supabase, creator.id),
    getCreatorBalance(supabase, creator.id),
    listCreatorSales(supabase, creator.id),
    getCreatorWorkSummary(supabase, creator.id),
  ]);

  const totalReceived = sales.reduce((sum, sale) => sum + sale.creatorAmountCents, 0);
  const publishedProducts = products.filter((product) => product.status === "approved").length;

  const salesByMonth = new Map<string, { label: string; total: number }>();
  for (const sale of sales) {
    const date = new Date(sale.confirmedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = salesByMonth.get(key) ?? {
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      total: 0,
    };
    current.total += sale.creatorAmountCents;
    salesByMonth.set(key, current);
  }
  const monthly = [...salesByMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, value]) => value);
  const maxMonth = Math.max(1, ...monthly.map((item) => item.total));

  return (
    <div className="flex flex-col gap-7">
      <DashboardPageHeader
        eyebrow="Visão geral"
        title={`Oi, ${creator.displayName.split(" ")[0]}`}
        description="O que está acontecendo com seus trabalhos e seu dinheiro agora."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Saldo disponível"
          value={formatBRL(balance.availableCents)}
          icon={Wallet}
          hint="Pronto para solicitar saque."
        />
        <StatCard
          label="Recebido em vendas"
          value={formatBRL(totalReceived)}
          icon={Receipt}
          hint={`${sales.length} ${sales.length === 1 ? "venda confirmada" : "vendas confirmadas"}`}
        />
        <StatCard
          label="Trabalhos em produção"
          value={String(work.inProduction)}
          icon={BriefcaseBusiness}
          hint={work.waitingForClient > 0 ? `${work.waitingForClient} aguardando o cliente` : "Nenhum esperando confirmação."}
        />
      </div>

      {work.nextDeadline ? (
        <Link
          href={`/dashboard/pedidos-personalizados/${work.nextDeadline.customRequestId}`}
          className="flex items-center justify-between gap-4 rounded-2xl bg-(--color-contrast) p-4 text-(--color-on-contrast) shadow-sm"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] opacity-60">Próximo prazo</p>
            <p className="mt-1 truncate font-semibold">{work.nextDeadline.serviceType}</p>
            <p className="mt-1 text-xs opacity-70">{formatDeadline(work.nextDeadline.deliveryDeadlineAt)}</p>
          </div>
          <ArrowRight size={18} className="shrink-0 text-(--color-accent)" strokeWidth={1.7} />
        </Link>
      ) : null}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-(--color-text)">Atalhos</h2>
          <p className="mt-0.5 text-xs text-(--color-text-muted)">As ações que você mais usa no dia a dia.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickLink
            href="/dashboard/pedidos-personalizados"
            icon={MessageSquare}
            title="Pedidos"
            detail={work.openRequests > 0 ? `${work.openRequests} conversa(s) aberta(s)` : "Ver conversas"}
          />
          <QuickLink
            href="/dashboard/oportunidades"
            icon={BriefcaseBusiness}
            title="Oportunidades"
            detail="Encontrar novos trabalhos"
          />
          <QuickLink
            href="/dashboard/servicos"
            icon={Store}
            title="Serviços"
            detail="Criar ou editar anúncio"
          />
          <QuickLink
            href="/dashboard/produtos/novo"
            icon={PackagePlus}
            title="Novo produto"
            detail={`${publishedProducts} publicado(s)`}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-(--color-text)">Recebido por mês</h2>
              <p className="mt-0.5 text-xs text-(--color-text-muted)">Valor líquido que ficou para você.</p>
            </div>
            <Link href="/dashboard/estatisticas" className="text-xs font-medium text-(--color-accent-text) hover:underline">
              Ver detalhes
            </Link>
          </div>

          {monthly.length === 0 ? (
            <p className="mt-8 text-sm text-(--color-text-muted)">As vendas confirmadas vão aparecer aqui.</p>
          ) : (
            <div className="mt-5 flex h-36 items-end gap-3">
              {monthly.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end justify-center rounded-xl bg-(--color-surface-2) px-2 pt-2">
                    <div
                      className="w-full max-w-10 rounded-t-lg bg-(--color-accent)"
                      style={{ height: `${Math.max(8, (item.total / maxMonth) * 100)}%` }}
                      title={formatBRL(item.total)}
                    />
                  </div>
                  <span className="text-[11px] capitalize text-(--color-text-subtle)">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-(--color-border) px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-(--color-text)">Últimas vendas</h2>
              <p className="mt-0.5 text-xs text-(--color-text-subtle)">Pagamentos já confirmados.</p>
            </div>
            <Link href="/dashboard/vendas" className="text-xs font-medium text-(--color-accent-text) hover:underline">
              Ver todas
            </Link>
          </div>

          {sales.length === 0 ? (
            <p className="px-4 py-8 text-sm text-(--color-text-muted)">Nenhuma venda confirmada ainda.</p>
          ) : (
            <div className="divide-y divide-(--color-border)">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-(--color-text)">{sale.title}</p>
                    <p className="mt-0.5 truncate text-xs text-(--color-text-subtle)">
                      {sale.buyerName} · {new Date(sale.confirmedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-(--color-text)">
                    {formatBRL(sale.creatorAmountCents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm transition-colors hover:border-(--color-accent-text)"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-surface-2)">
        <Icon size={17} className="text-(--color-accent-text)" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-(--color-text)">{title}</p>
        <p className="mt-0.5 truncate text-xs text-(--color-text-muted)">{detail}</p>
      </div>
    </Link>
  );
}
