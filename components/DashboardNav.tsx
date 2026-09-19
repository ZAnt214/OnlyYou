"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserRound,
  Package,
  Receipt,
  Wallet,
  Ticket,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronDown,
} from "lucide-react";

/**
 * Navegação do painel do criador. No mobile isso era uma lista horizontal
 * de abas sem marcação de ativa, no topo de cada página — competia
 * visualmente com o título/conteúdo da própria seção (ex.: abrir "Pedidos
 * personalizados" e ainda ver as outras 9 abas do painel espremidas ali em
 * cima). Agora é um botão "Painel" com a seção atual, que abre um menu com
 * as demais opções — a navegação do painel fica separada do conteúdo da
 * página, em vez de misturada com ele. No desktop continua uma barra
 * lateral normal, já suficientemente separada do conteúdo por estar numa
 * coluna própria.
 */
export function DashboardNav({ creatorUsername }: { creatorUsername: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NAV = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: `/criadores/${creatorUsername}`, label: "Meu perfil", icon: UserRound },
    { href: "/dashboard/produtos", label: "Produtos", icon: Package },
    { href: "/dashboard/vendas", label: "Vendas", icon: Receipt },
    { href: "/dashboard/pedidos-personalizados", label: "Pedidos personalizados", icon: MessageSquare },
    { href: "/dashboard/carteira", label: "Carteira", icon: Wallet },
    { href: "/dashboard/cupons", label: "Cupons", icon: Ticket },
    { href: "/dashboard/afiliados", label: "Afiliados", icon: Users, disabled: true },
    { href: "/dashboard/estatisticas", label: "Estatísticas", icon: BarChart3 },
    { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const activeItem = NAV.find((item) => isActive(item.href)) ?? NAV[0];

  return (
    <aside className="flex-shrink-0 md:w-56">
      {/* Mobile: botão "Painel" + menu, em vez das abas soltas no topo da página. */}
      <div className="relative md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm font-medium text-(--color-text)"
        >
          <span className="flex items-center gap-2">
            <activeItem.icon size={16} strokeWidth={1.5} />
            {activeItem.label}
          </span>
          <ChevronDown size={16} strokeWidth={1.5} className={open ? "rotate-180" : ""} />
        </button>
        {open ? (
          <nav
            role="menu"
            className="absolute left-0 right-0 z-20 mt-1 flex flex-col rounded-md border border-(--color-border) bg-(--color-surface) py-1 shadow-lg shadow-black/10"
          >
            {NAV.map((item) =>
              item.disabled ? (
                <span
                  key={item.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-(--color-text-subtle)"
                  title="Em breve"
                >
                  <item.icon size={14} strokeWidth={1.5} />
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${
                    isActive(item.href)
                      ? "bg-(--color-accent-soft) text-(--color-accent)"
                      : "text-(--color-text-muted) hover:bg-(--color-surface-2)"
                  }`}
                >
                  <item.icon size={14} strokeWidth={1.5} />
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        ) : null}
      </div>

      {/* Desktop: barra lateral fixa, já numa coluna própria. */}
      <nav className="hidden md:flex md:flex-col md:gap-1">
        {NAV.map((item) =>
          item.disabled ? (
            <span
              key={item.href}
              className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-(--color-text-subtle)"
              title="Em breve"
            >
              <item.icon size={14} strokeWidth={1.5} />
              {item.label}
            </span>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                isActive(item.href)
                  ? "bg-(--color-accent-soft) text-(--color-accent)"
                  : "text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
              }`}
            >
              <item.icon size={14} strokeWidth={1.5} />
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </aside>
  );
}
