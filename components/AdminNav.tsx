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
      className="grid grid-cols-3 gap-2 md:flex md:flex-col"
    >
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-[11px] font-medium transition-colors md:min-h-11 md:flex-row md:justify-start md:gap-2.5 md:px-3 md:py-2.5 md:text-left md:text-sm ${
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
