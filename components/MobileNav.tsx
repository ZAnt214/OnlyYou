"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Heart, LayoutDashboard } from "lucide-react";

export function MobileNav({ creatorUsername }: { creatorUsername: string }) {
  const pathname = usePathname();

  const TABS = [
    { href: "/", label: "Início", icon: Home },
    { href: "/descobrir", label: "Descobrir", icon: Search },
    { href: "/biblioteca", label: "Biblioteca", icon: Library },
    { href: "/favoritos", label: "Favoritos", icon: Heart },
    {
      href: `/criadores/${creatorUsername}`,
      label: "Criador",
      icon: LayoutDashboard,
      matchPrefixes: [`/criadores/${creatorUsername}`, "/dashboard"],
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-(--color-border) bg-(--color-bg) md:hidden">
      {TABS.map((tab) => {
        const prefixes = tab.matchPrefixes ?? [tab.href];
        const active =
          pathname === tab.href || (tab.href !== "/" && prefixes.some((p) => pathname.startsWith(p)));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
              active ? "text-(--color-accent)" : "text-(--color-text-muted)"
            }`}
          >
            <tab.icon size={18} strokeWidth={1.5} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
