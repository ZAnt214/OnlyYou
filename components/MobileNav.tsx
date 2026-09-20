"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, MessageSquare, LayoutDashboard } from "lucide-react";
import { useCreatorUsername } from "@/lib/supabase/useCreatorUsername";
import { isConversationScreenPath } from "@/lib/isConversationScreenPath";

export function MobileNav() {
  const pathname = usePathname();
  const creatorUsername = useCreatorUsername();

  const TABS = [
    { href: "/", label: "Início", icon: Home },
    { href: "/descobrir", label: "Explorar", icon: Compass },
    { href: "/biblioteca", label: "Biblioteca", icon: Library },
    { href: "/pedidos", label: "Mensagens", icon: MessageSquare },
    {
      href: `/criadores/${creatorUsername}`,
      label: "Criador",
      icon: LayoutDashboard,
      matchPrefixes: [`/criadores/${creatorUsername}`, "/dashboard"],
    },
  ];

  // Tela de conversa é tela cheia de verdade — sem nav do site por trás.
  if (isConversationScreenPath(pathname)) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-4 bottom-2 z-20 mx-auto flex max-w-sm items-center justify-around rounded-(--radius-pill) border border-(--color-border) bg-(--color-surface)/95 px-2 py-1 shadow-lg shadow-black/10 backdrop-blur-md md:hidden"
    >
      {TABS.map((tab) => {
        const prefixes = tab.matchPrefixes ?? [tab.href];
        const active =
          pathname === tab.href || (tab.href !== "/" && prefixes.some((p) => pathname.startsWith(p)));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-11 w-12 items-center justify-center transition-colors ${
              active
                ? "text-(--color-accent)"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            }`}
          >
            <tab.icon size={20} strokeWidth={active ? 2 : 1.65} />
            {active ? (
              <span className="absolute bottom-0.5 h-0.5 w-4 rounded-full bg-(--color-accent)" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
