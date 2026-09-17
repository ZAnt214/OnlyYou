"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, MessageSquare, LayoutDashboard } from "lucide-react";

export function MobileNav({ creatorUsername }: { creatorUsername: string }) {
  const pathname = usePathname();

  const TABS = [
    { href: "/", label: "Início", icon: Home },
    { href: "/descobrir", label: "Descobrir", icon: Search },
    { href: "/biblioteca", label: "Biblioteca", icon: Library },
    { href: "/pedidos", label: "Mensagens", icon: MessageSquare },
    {
      href: `/criadores/${creatorUsername}`,
      label: "Criador",
      icon: LayoutDashboard,
      matchPrefixes: [`/criadores/${creatorUsername}`, "/dashboard"],
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-3 z-20 mx-auto flex w-fit gap-1 rounded-(--radius-pill) border border-(--color-border) bg-(--color-surface) p-1.5 shadow-lg shadow-black/10 md:hidden">
      {TABS.map((tab) => {
        const prefixes = tab.matchPrefixes ?? [tab.href];
        const active =
          pathname === tab.href || (tab.href !== "/" && prefixes.some((p) => pathname.startsWith(p)));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            className={`flex items-center justify-center rounded-(--radius-pill) p-3 transition-colors ${
              active
                ? "bg-(--color-accent-soft) text-(--color-accent)"
                : "text-(--color-text-muted)"
            }`}
          >
            <tab.icon size={20} strokeWidth={1.75} />
          </Link>
        );
      })}
    </nav>
  );
}
