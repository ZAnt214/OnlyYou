"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  LayoutDashboard,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  Store,
  Wallet,
} from "lucide-react";

interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface DashboardNavGroup {
  label: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    label: "Trabalho",
    items: [
      { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/oportunidades", label: "Oportunidades", icon: BriefcaseBusiness },
      { href: "/dashboard/pedidos-personalizados", label: "Pedidos", icon: MessageSquare },
      { href: "/dashboard/servicos", label: "Serviços", icon: Store },
      { href: "/dashboard/produtos", label: "Produtos", icon: Package },
    ],
  },
  {
    label: "Dinheiro",
    items: [
      { href: "/dashboard/vendas", label: "Vendas", icon: Receipt },
      { href: "/dashboard/carteira", label: "Carteira", icon: Wallet },
      { href: "/dashboard/estatisticas", label: "Estatísticas", icon: BarChart3 },
    ],
  },
  {
    label: "Conta",
    items: [{ href: "/dashboard/configuracoes", label: "Configurações", icon: Settings }],
  },
];

function isActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    const items: DashboardNavItem[] = DASHBOARD_NAV_GROUPS.flatMap((group) => group.items);
    return (
      <nav
        aria-label="Seções do painel"
        className="no-scrollbar sticky top-16 z-20 -mx-4 flex gap-2 overflow-x-auto border-b border-(--color-border) bg-(--color-bg) px-4 py-3 md:hidden"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? "border-(--color-contrast) bg-(--color-contrast) text-(--color-on-contrast)"
                  : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted)"
              }`}
            >
              <Icon size={14} strokeWidth={1.7} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Seções do painel" className="flex flex-col gap-5">
      {DASHBOARD_NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-subtle)">
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-(--color-contrast) font-medium text-(--color-on-contrast)"
                    : "text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text)"
                }`}
              >
                <Icon
                  size={17}
                  strokeWidth={active ? 2 : 1.6}
                  className={active ? "text-(--color-accent)" : "text-(--color-text-subtle)"}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
