"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isConversationScreenPath } from "@/lib/isConversationScreenPath";
import {
  Search,
  LayoutDashboard,
  Library,
  Heart,
  ShieldCheck,
  User,
  ChevronDown,
  MessageSquare,
  Bell,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { categories } from "@/lib/data/categories";
import { NotificationBell } from "@/components/NotificationBell";
import { createClient } from "@/lib/supabase/client";
import { useCreatorUsername } from "@/lib/supabase/useCreatorUsername";

const NAV_LINKS = [
  { href: "/descobrir", label: "Explorar", compact: false },
  { href: "/oportunidades", label: "Oportunidades", compact: false },
  { href: "/criadores", label: "Criadores", compact: false },
  { href: "/descobrir?sort=vendidos", label: "Mais vendidos", compact: true },
  { href: "/descobrir?ofertas=1", label: "Ofertas", compact: true },
];

const CREATOR_FEED_LINK = {
  href: "/dashboard/oportunidades",
  label: "Feed de oportunidades",
  compact: false,
};

export function Header() {
  const creatorUsername = useCreatorUsername();

  const ACCOUNT_LINKS = [
    { href: "/biblioteca", label: "Biblioteca", icon: Library },
    { href: "/pedidos", label: "Mensagens", icon: MessageSquare },
    { href: "/oportunidades/minhas", label: "Minhas publicações", icon: ClipboardList },
    { href: "/notificacoes", label: "Notificações", icon: Bell },
    { href: "/favoritos", label: "Favoritos", icon: Heart },
    { href: creatorUsername ? `/criadores/${creatorUsername}` : "/dashboard", label: "Área do criador", icon: LayoutDashboard },
    { href: "/seguranca", label: "Central de segurança", icon: ShieldCheck },
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const navigationLinks = isCreator
    ? [NAV_LINKS[0], CREATOR_FEED_LINK, ...NAV_LINKS.slice(1)]
    : NAV_LINKS;

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function syncAccount(user: { id: string; email?: string } | null) {
      if (!active) return;
      setAuthEmail(user?.email ?? null);
      if (!user) {
        setIsCreator(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", user.id)
        .maybeSingle();

      if (active) {
        setIsCreator(Array.isArray(data?.roles) && data.roles.includes("creator"));
      }
    }

    supabase.auth.getUser().then(({ data }) => syncAccount(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAccount(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      await supabase.auth.signOut({ scope: "local" });
    }
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  // Tela de conversa é tela cheia de verdade — sem header do site por trás.
  if (isConversationScreenPath(pathname)) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-(--color-border) bg-(--color-bg)">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-5">
        <Link href="/" className="group relative shrink-0 py-2 text-3xl font-bold tracking-tight text-(--color-text)">
          Jobê<span className="text-(--color-accent-text)">.</span>

        </Link>

        <nav aria-label="Navegação do cabeçalho" className="hidden items-center gap-1 md:flex">
          {navigationLinks.filter((link) => !link.compact && link.href !== "/dashboard/oportunidades").map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`whitespace-nowrap px-2 py-3 text-sm transition-colors hover:text-(--color-text) ${pathname === link.href ? "font-semibold text-(--color-text)" : "text-(--color-text-muted)"}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="relative hidden xl:block">
            <button
              type="button"
              onClick={() => setCategoriesOpen((v) => !v)}
              aria-expanded={categoriesOpen}
              className="flex items-center gap-1 px-2 py-2 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text)"
            >
              Categorias
              <ChevronDown size={14} strokeWidth={1.5} />
            </button>
            {categoriesOpen ? (
              <div className="absolute left-0 z-10 mt-2 w-56 rounded-xl border border-(--color-border) bg-(--color-surface) py-1.5 shadow-lg shadow-black/10">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/categorias/${c.slug}`}
                    onClick={() => setCategoriesOpen(false)}
                    className="block px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-2)"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <form
          action="/descobrir"
          role="search"
          aria-label="Buscar no site"
          className="ml-auto hidden min-w-0 max-w-52 flex-1 items-center gap-2 rounded-(--radius-pill) border border-(--color-border) bg-(--color-bg) px-4 py-2 xl:flex"
        >
          <Search size={14} className="text-(--color-text-subtle)" strokeWidth={1.5} />
          <input
            name="q"
            type="search"
            aria-label="Buscar serviços, produtos e profissionais"
            placeholder="Buscar no Jobê"
            className="w-full bg-transparent text-sm text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <NotificationBell />
            {!authEmail ? (
              <>
                <Link
                  href="/entrar"
                  className="rounded-(--radius-pill) px-3 py-2 text-sm text-(--color-text-muted) hover:text-(--color-text)"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-(--radius-pill) bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover)"
                >
                  Criar conta
                </Link>
              </>
            ) : null}
          </div>

          <div className="flex h-10 items-center md:hidden">
            <NotificationBell />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-surface-2) text-xs font-semibold uppercase text-(--color-text-muted) transition-colors hover:text-(--color-text) md:h-9 md:w-9"
              aria-label="Menu da conta"
              aria-expanded={menuOpen}
            >
              {authEmail ? authEmail.slice(0, 2) : <User size={16} strokeWidth={1.5} />}
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-10 mt-1 hidden w-56 rounded-xl border border-(--color-border) bg-(--color-surface) py-1 shadow-lg shadow-black/10 md:block">
                {authEmail ? (
                  <p className="truncate border-b border-(--color-border) px-3 py-2 text-xs text-(--color-text-subtle)">
                    {authEmail}
                  </p>
                ) : null}
                {ACCOUNT_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface)"
                  >
                    <link.icon size={14} strokeWidth={1.5} />
                    {link.label}
                  </Link>
                ))}
                {authEmail ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 border-t border-(--color-border) px-3 py-2 text-left text-sm text-(--color-text) hover:bg-(--color-surface)"
                  >
                    <LogOut size={14} strokeWidth={1.5} />
                    Sair
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {menuOpen ? (
        <div className="absolute inset-x-3 top-[calc(100%+0.5rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 shadow-lg shadow-black/10 md:hidden">
          {authEmail ? (
            <p className="mb-2 truncate px-2 py-1 text-xs text-(--color-text-subtle)">{authEmail}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-1">
            {[
              ...navigationLinks,
              ...(!authEmail ? [{ href: "/entrar", label: "Entrar" }, { href: "/cadastro", label: "Criar conta" }] : []),
              ...ACCOUNT_LINKS,
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-(--color-text) hover:bg-(--color-surface-2)"
              >
                {link.label}
              </Link>
            ))}
            {authEmail ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-(--color-text) hover:bg-(--color-surface-2)"
              >
                <LogOut size={14} strokeWidth={1.5} />
                Sair
              </button>
            ) : null}
          </div>

          <p className="mb-1 mt-4 border-t border-(--color-border) px-2 pt-3 text-xs font-medium text-(--color-text-subtle)">Categorias</p>
          <div className="grid grid-cols-2 gap-1">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categorias/${c.slug}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-(--color-text) hover:bg-(--color-surface-2)"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
