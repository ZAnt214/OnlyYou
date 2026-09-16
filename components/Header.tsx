"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Library,
  Heart,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  MessageSquare,
  Bell,
  LogOut,
} from "lucide-react";
import { categories } from "@/lib/data/categories";
import { NotificationBell } from "@/components/NotificationBell";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/descobrir", label: "Descobrir" },
  { href: "/criadores", label: "Criadores" },
  { href: "/descobrir?sort=vendidos", label: "Mais vendidos" },
  { href: "/descobrir?ofertas=1", label: "Ofertas" },
];

export function Header({ creatorUsername }: { creatorUsername: string }) {
  const ACCOUNT_LINKS = [
    { href: "/biblioteca", label: "Biblioteca", icon: Library },
    { href: "/pedidos", label: "Minhas solicitações", icon: MessageSquare },
    { href: "/notificacoes", label: "Notificações", icon: Bell },
    { href: "/favoritos", label: "Favoritos", icon: Heart },
    { href: `/criadores/${creatorUsername}`, label: "Área do criador", icon: LayoutDashboard },
    { href: "/seguranca", label: "Central de segurança", icon: ShieldCheck },
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthEmail(data.user?.email ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setAuthEmail(session?.user?.email ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-(--color-border) bg-(--color-bg)">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-(--color-text)">
          OnlyYou
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
            >
              {link.label}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoriesOpen((v) => !v)}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
            >
              Categorias
              <ChevronDown size={14} strokeWidth={1.5} />
            </button>
            {categoriesOpen ? (
              <div className="absolute left-0 z-10 mt-1 w-56 rounded-md border border-(--color-border) bg-(--color-bg) py-1 shadow-sm">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/categorias/${c.slug}`}
                    onClick={() => setCategoriesOpen(false)}
                    className="block px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface)"
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
          className="ml-auto hidden max-w-xs flex-1 items-center gap-2 rounded-md border border-(--color-border) px-3 py-1.5 md:flex"
        >
          <Search size={14} className="text-(--color-text-subtle)" strokeWidth={1.5} />
          <input
            name="q"
            type="search"
            placeholder="Buscar produtos ou criadores"
            className="w-full bg-transparent text-sm text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none"
          />
        </form>

        <div className="hidden items-center gap-2 md:flex">
          <NotificationBell />
          {!authEmail ? (
            <>
              <Link
                href="/entrar"
                className="rounded-md px-3 py-2 text-sm text-(--color-text-muted) hover:text-(--color-text)"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-md bg-(--color-accent) px-3 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
              >
                Criar conta
              </Link>
            </>
          ) : null}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-(--color-border) text-(--color-text-muted) hover:bg-(--color-surface)"
              aria-label="Menu da conta"
            >
              <LayoutDashboard size={14} strokeWidth={1.5} />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-(--color-border) bg-(--color-bg) py-1 shadow-sm">
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

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-(--color-text-muted) md:hidden"
          aria-label="Abrir menu"
        >
          {menuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-(--color-border) px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {[
              ...NAV_LINKS,
              ...(!authEmail ? [{ href: "/entrar", label: "Entrar" }, { href: "/cadastro", label: "Criar conta" }] : []),
              ...ACCOUNT_LINKS,
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-(--color-text) hover:bg-(--color-surface)"
              >
                {link.label}
              </Link>
            ))}
            {authEmail ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-(--color-text) hover:bg-(--color-surface)"
              >
                <LogOut size={14} strokeWidth={1.5} />
                Sair
              </button>
            ) : null}
          </div>

          <p className="mb-1 mt-4 px-2 text-xs text-(--color-text-subtle)">Categorias</p>
          <div className="flex flex-col gap-1">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categorias/${c.slug}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-(--color-text) hover:bg-(--color-surface)"
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
