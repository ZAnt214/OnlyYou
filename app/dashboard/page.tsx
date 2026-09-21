"use client";

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Product, User } from "@/lib/types";
import { listProductsForCreator } from "@/lib/supabase/products";
import { useSaleRepository } from "@/lib/repositories/SaleRepository";
import { createClient } from "@/lib/supabase/client";
import { getCreatorBalance } from "@/lib/supabase/wallet";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardLoading } from "@/components/DashboardLoading";
import {
  DollarSign,
  Package,
  Wallet,
  Receipt,
  MessageSquare,
  Megaphone,
  Ticket,
  Users,
  BarChart3,
  Settings,
  Loader2,
  BriefcaseBusiness,
} from "lucide-react";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * useLinkStatus só funciona num componente filho do Link (lê o estado de
 * pendência daquele link específico via contexto) — por isso não dá pra
 * chamar o hook direto no componente que renderiza o <Link>. Sem isso, o
 * card ficava sem nenhum feedback entre o toque e a navegação terminar.
 */
function HubCardIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  if (pending) return <Loader2 size={20} className="animate-spin text-(--color-accent-text)" strokeWidth={1.5} />;
  return <Icon size={20} strokeWidth={1.5} className="text-(--color-accent-text)" />;
}

/**
 * O painel é hub-style: as seções vivem só aqui, como cards — não há mais
 * nav/dropdown persistente em cada subpágina (ver DashboardBackLink, que
 * só devolve pra este hub). "Meu perfil" fica de fora: já é acessível pelo
 * cabeçalho/nav do site, essa lista é só o que é exclusivo do painel.
 */
const SECTIONS = [
  { href: "/dashboard/oportunidades", label: "Oportunidades", icon: BriefcaseBusiness },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/servicos", label: "Serviços", icon: Megaphone },
  { href: "/dashboard/vendas", label: "Vendas", icon: Receipt },
  { href: "/dashboard/pedidos-personalizados", label: "Pedidos personalizados", icon: MessageSquare },
  { href: "/dashboard/carteira", label: "Carteira", icon: Wallet },
  { href: "/dashboard/cupons", label: "Cupons", icon: Ticket },
  { href: "/dashboard/afiliados", label: "Afiliados", icon: Users, disabled: true },
  { href: "/dashboard/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export default function DashboardOverviewPage() {
  const saleRepo = useSaleRepository();
  const [creator, setCreator] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    (async () => {
      const c = await getCurrentCreatorClient();
      setCreator(c);
      const supabase = createClient();
      setProducts(await listProductsForCreator(supabase, c.id));
      const balance = await getCreatorBalance(supabase, c.id);
      setAvailable(balance.availableCents / 100);
    })();
  }, []);

  const sales = creator ? saleRepo.findByCreator(creator.id) : [];
  const totalVendas = sales.reduce((sum, s) => sum + s.grossAmount, 0);
  const produtosVendidos = new Set(sales.map((s) => s.productId)).size;

  const salesByMonth = sales.reduce<Record<string, number>>((acc, s) => {
    const key = new Date(s.createdAt).toLocaleDateString("pt-BR", { month: "short" });
    acc[key] = (acc[key] ?? 0) + s.grossAmount;
    return acc;
  }, {});
  const maxMonth = Math.max(1, ...Object.values(salesByMonth));

  const topProducts = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);

  // Os cards de navegação não dependem de nenhum dado assíncrono — não faz
  // sentido travar eles atrás do carregamento de identidade/saldo, que é
  // exatamente o que a pessoa clicaria pra fugir dessa tela. Só as
  // estatísticas abaixo esperam `creator`.
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Dashboard</h1>
        <p className="text-sm text-(--color-text-muted)">Você recebe pelas vendas realizadas.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SECTIONS.map((section) =>
          section.disabled ? (
            <span
              key={section.href}
              title="Em breve"
              className="flex flex-col items-center gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 text-center text-sm text-(--color-text-subtle)"
            >
              <section.icon size={20} strokeWidth={1.5} />
              {section.label}
            </span>
          ) : (
            <Link
              key={section.href}
              href={section.href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 text-center text-sm text-(--color-text) shadow-sm transition-transform hover:border-(--color-accent-text) active:scale-95 active:bg-(--color-surface-2)"
            >
              <HubCardIcon icon={section.icon} />
              {section.label}
            </Link>
          ),
        )}
      </div>

      {!creator ? (
        <DashboardLoading />
      ) : (
        <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Vendas totais" value={formatBRL(totalVendas)} icon={DollarSign} />
        <StatCard label="Produtos vendidos" value={String(produtosVendidos)} icon={Package} />
        <StatCard label="Saldo disponível" value={formatBRL(available)} icon={Wallet} />
      </div>

      <div className="rounded-lg border border-(--color-border) p-4">
        <h2 className="mb-3 text-sm font-medium text-(--color-text)">Vendas por mês</h2>
        {Object.keys(salesByMonth).length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Nenhuma venda foi realizada neste período.</p>
        ) : (
          <div className="flex items-end gap-3">
            {Object.entries(salesByMonth).map(([month, total]) => (
              <div key={month} className="flex flex-col items-center gap-1">
                <div
                  className="w-8 rounded-t-sm bg-(--color-accent)"
                  style={{ height: `${Math.max(8, (total / maxMonth) * 100)}px` }}
                  title={formatBRL(total)}
                />
                <span className="text-xs text-(--color-text-subtle)">{month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-(--color-border)">
        <h2 className="border-b border-(--color-border) px-4 py-3 text-sm font-medium text-(--color-text)">
          Últimas vendas
        </h2>
        {sales.length === 0 ? (
          <p className="px-4 py-3 text-sm text-(--color-text-muted)">
            Nenhuma venda foi realizada neste período.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {sales
                .slice()
                .reverse()
                .slice(0, 6)
                .map((s) => (
                  <tr key={s.id} className="border-b border-(--color-border) last:border-0">
                    <td className="px-4 py-2 text-(--color-text)">{s.productId}</td>
                    <td className="px-4 py-2 text-(--color-text-muted)">
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-(--color-text)">
                      {formatBRL(s.creatorAmount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-(--color-border)">
        <h2 className="border-b border-(--color-border) px-4 py-3 text-sm font-medium text-(--color-text)">
          Produtos com melhor desempenho
        </h2>
        {topProducts.length === 0 ? (
          <p className="px-4 py-3 text-sm text-(--color-text-muted)">Nenhum produto publicado ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.id} className="border-b border-(--color-border) last:border-0">
                  <td className="px-4 py-2 text-(--color-text)">{p.title}</td>
                  <td className="px-4 py-2 text-(--color-text-muted)">{p.salesCount} vendas</td>
                  <td className="px-4 py-2 text-right">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
        </>
      )}
    </div>
  );
}
