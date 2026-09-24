"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isConversationScreenPath } from "@/lib/isConversationScreenPath";

const LINKS = [
  { href: "/sobre", label: "Sobre" },
  { href: "/para-criadores", label: "Para criadores" },
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/conteudo", label: "Política de conteúdo" },
  { href: "/seguranca", label: "Central de segurança" },
];

export function Footer() {
  const pathname = usePathname();
  // Conversas e o painel do criador funcionam como área de trabalho:
  // o rodapé público só ocupa espaço e quebra a sensação de app nessas telas.
  if (isConversationScreenPath(pathname) || pathname.startsWith("/dashboard")) return null;

  return (
    <footer className="border-t border-(--color-border) py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-(--color-text-muted) sm:flex-row sm:items-center sm:justify-between">
        <div><Link href="/" className="text-3xl font-bold tracking-tight text-(--color-text)">Jobê<span className="text-(--color-accent-text)">.</span></Link><p className="mt-1 text-xs">Ideias encontram quem faz.</p><p className="mt-2 text-xs">© {new Date().getFullYear()} Jobê.</p></div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-(--color-text)">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
