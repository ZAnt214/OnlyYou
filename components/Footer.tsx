import Link from "next/link";

const LINKS = [
  { href: "/sobre", label: "Sobre" },
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/conteudo", label: "Política de conteúdo" },
  { href: "/seguranca", label: "Central de segurança" },
];

export function Footer() {
  return (
    <footer className="border-t border-(--color-border) py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-(--color-text-muted) sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Jobê. Encontre quem faz.</span>
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
