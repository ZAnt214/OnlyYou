"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  CreditCard,
  Flag,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/admin/saques", label: "Saques", icon: ArrowDownToLine },
  { href: "/admin/denuncias", label: "Denúncias", icon: Flag },
  { href: "/admin/conversas", label: "Conversas", icon: MessageSquare },
];

function isActive(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação administrativa"
      className="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible"
    >
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-(--color-text) text-(--color-bg)"
                : "text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text)"
            }`}
          >
            <Icon
              size={17}
              strokeWidth={active ? 2 : 1.6}
              className={active ? "text-(--color-accent)" : ""}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
