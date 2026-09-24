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
import {
  getCreatorMonthlySales,
  getCreatorSalesSummary,
  getCreatorWorkSummary,
  listCreatorSalesPage,
} from "@/lib/supabase/dashboard";

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
  const [products, balance, salesSummary, recentSales, monthly, work] = await Promise.all([
    listProductsForCreator(supabase, creator.id),
    getCreatorBalance(supabase, creator.id),
    getCreatorSalesSummary(supabase),
    listCreatorSalesPage(supabase, { limit: 5 }),
    getCreatorMonthlySales(supabase, 6),
    getCreatorWorkSummary(supabase, creator.id),
  ]);

  const publishedProducts = products.filter((product) => product.status === "approved").length;
  const maxMonth = Math.max(1, ...monthly.map((item) => item.creatorAmountCents));

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
          value={formatBRL(salesSummary.creatorAmountCents)}
          icon={Receipt}
          hint={`${salesSummary.totalSales} ${salesSummary.totalSales === 1 ? "venda confirmada" : "vendas confirmadas"}`}
        />
        <StatCard
          label="Trabalhos em produção"
          value={String(work.inProduction)}
          icon={BriefcaseBusiness}
          hint={work.waitingForClient > 0 ? `${work.waitingForClient} aguardando o cliente` : "Nenhum esperando confirmação."}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
        <div className="border-b border-(--color-border) px-4 py-3">
          <h2 className="text-sm font-semibold text-(--color-text)">Agora</h2>
          <p className="mt-0.5 text-xs text-(--color-text-subtle)">O que merece sua atenção primeiro.</p>
        </div>

        <div className="divide-y divide-(--color-border)">
          {work.nextDeadline ? (
            <AttentionRow
              href={`/dashboard/pedidos-personalizados/${work.nextDeadline.customRequestId}`}
              title={work.nextDeadline.serviceType}
              detail={`Próximo prazo · ${formatDeadline(work.nextDeadline.deliveryDeadlineAt)}`}
              accent
            />
          ) : null}

          {work.openRequests > 0 ? (
            <AttentionRow
              href="/dashboard/pedidos-personalizados"
              title={`${work.openRequests} ${work.openRequests === 1 ? "pedido esperando resposta" : "pedidos esperando resposta"}`}
              detail="Abra a conversa e veja o que a pessoa precisa."
            />
          ) : null}

          {work.awaitingPayment > 0 ? (
            <AttentionRow
              href="/dashboard/pedidos-personalizados"
              title={`${work.awaitingPayment} ${work.awaitingPayment === 1 ? "trabalho aguardando pagamento" : "trabalhos aguardando pagamento"}`}
              detail="O trabalho começa depois da confirmação."
            />
          ) : null}

          {work.waitingForClient > 0 ? (
            <AttentionRow
              href="/dashboard/pedidos-personalizados"
              title={`${work.waitingForClient} ${work.waitingForClient === 1 ? "trabalho esperando o cliente" : "trabalhos esperando o cliente"}`}
              detail="Você já finalizou; agora falta a confirmação."
            />
          ) : null}

          {!work.nextDeadline &&
          work.openRequests === 0 &&
          work.awaitingPayment === 0 &&
          work.waitingForClient === 0 ? (
            <p className="px-4 py-6 text-sm text-(--color-text-muted)">Tudo em dia por aqui.</p>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-(--color-text)">Fazer agora</h2>
          <p className="mt-0.5 text-xs text-(--color-text-muted)">Caminhos rápidos sem sair procurando pelo painel.</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-border) sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            href="/dashboard/pedidos-personalizados"
            icon={MessageSquare}
            title="Abrir pedidos"
            detail="Conversas e propostas"
          />
          <QuickLink
            href="/dashboard/oportunidades"
            icon={BriefcaseBusiness}
            title="Buscar trabalho"
            detail="Ver pedidos publicados"
          />
          <QuickLink
            href="/dashboard/servicos"
            icon={Store}
            title="Meus serviços"
            detail="Criar, pausar ou editar"
          />
          <QuickLink
            href="/dashboard/produtos/novo"
            icon={PackagePlus}
            title="Novo produto"
            detail={`${publishedProducts} ${publishedProducts === 1 ? "publicado" : "publicados"}`}
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
              {monthly.map((item) => (
                <div key={item.monthStart} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end justify-center rounded-xl bg-(--color-surface-2) px-2 pt-2">
                    <div
                      className="w-full max-w-10 rounded-t-lg bg-(--color-accent)"
                      style={{ height: `${Math.max(8, (item.creatorAmountCents / maxMonth) * 100)}%` }}
                      title={formatBRL(item.creatorAmountCents)}
                    />
                  </div>
                  <span className="text-[11px] capitalize text-(--color-text-subtle)">
                    {new Date(`${item.monthStart}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                  </span>
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

          {recentSales.items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-(--color-text-muted)">Nenhuma venda confirmada ainda.</p>
          ) : (
            <div className="divide-y divide-(--color-border)">
              {recentSales.items.map((sale) => (
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

function AttentionRow({
  href,
  title,
  detail,
  accent = false,
}: {
  href: string;
  title: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-(--color-surface-2)">
      <div className="min-w-0">
        <p className={`truncate text-sm font-medium ${accent ? "text-(--color-accent-text)" : "text-(--color-text)"}`}>
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-(--color-text-subtle)">{detail}</p>
      </div>
      <ArrowRight size={15} className="shrink-0 text-(--color-text-subtle)" strokeWidth={1.7} />
    </Link>
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
      className="flex min-w-0 items-center gap-3 bg-(--color-surface) p-4 transition-colors hover:bg-(--color-surface-2)"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--color-surface-2)">
        <Icon size={17} className="text-(--color-accent-text)" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-(--color-text)">{title}</p>
        <p className="mt-0.5 truncate text-xs text-(--color-text-muted)">{detail}</p>
      </div>
    </Link>
  );
}
