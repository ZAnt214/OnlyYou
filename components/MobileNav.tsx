"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, MessageSquare, LayoutDashboard, BriefcaseBusiness } from "lucide-react";
import { useCreatorUsername } from "@/lib/supabase/useCreatorUsername";
import { isConversationScreenPath } from "@/lib/isConversationScreenPath";

export function MobileNav() {
  const pathname = usePathname();
  const creatorUsername = useCreatorUsername();

  const TABS = [
    { href: "/", label: "Início", icon: Home },
    { href: "/descobrir", label: "Explorar", icon: Compass },
    { href: "/oportunidades", label: "Pedidos", icon: BriefcaseBusiness },
    { href: "/biblioteca", label: "Biblioteca", icon: Library },
    { href: "/pedidos", label: "Conversas", icon: MessageSquare },
    {
      href: creatorUsername ? `/criadores/${creatorUsername}` : "/dashboard",
      label: "Perfil",
      icon: LayoutDashboard,
      matchPrefixes: creatorUsername ? [`/criadores/${creatorUsername}`, "/dashboard"] : ["/dashboard"],
      excludePrefixes: ["/oportunidades", "/dashboard/oportunidades"],
    },
  ];

  // Tela de conversa é tela cheia de verdade — sem nav do site por trás.
  if (isConversationScreenPath(pathname)) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-(--color-border) bg-(--color-bg) px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {TABS.map((tab) => {
        const prefixes = tab.matchPrefixes ?? [tab.href];
        const excluded = tab.excludePrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false;
        const active =
          !excluded && (pathname === tab.href || (tab.href !== "/" && prefixes.some((p) => pathname.startsWith(p))));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              active
                ? "text-(--color-accent-text)"
                : "text-(--color-text-muted) hover:text-(--color-text)"
            }`}
          >
            <tab.icon size={20} strokeWidth={active ? 2 : 1.65} />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {active ? (
              <span className="absolute -top-2 h-0.5 w-4 rounded-full bg-(--color-accent)" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
