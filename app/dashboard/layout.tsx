import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Wallet,
  Ticket,
  Users,
  BarChart3,
  Settings,
  ExternalLink,
} from "lucide-react";
import { userRepository } from "@/lib/repositories/UserRepository";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/vendas", label: "Vendas", icon: Receipt },
  { href: "/dashboard/carteira", label: "Carteira", icon: Wallet },
  { href: "/dashboard/cupons", label: "Cupons", icon: Ticket },
  { href: "/dashboard/afiliados", label: "Afiliados", icon: Users, disabled: true },
  { href: "/dashboard/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings, disabled: true },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const creator = await userRepository.findMockCurrentCreator();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="flex-shrink-0 md:w-56">
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((item) =>
            item.disabled ? (
              <span
                key={item.href}
                className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-(--color-text-subtle)"
                title="Em breve"
              >
                <item.icon size={14} strokeWidth={1.5} />
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
              >
                <item.icon size={14} strokeWidth={1.5} />
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="mt-4 border-t border-(--color-border) pt-4 md:mt-6">
          <p className="mb-1 px-3 text-xs text-(--color-text-subtle)">
            Como os compradores veem
          </p>
          <Link
            href={`/criadores/${creator.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
          >
            <ExternalLink size={14} strokeWidth={1.5} />
            Meu perfil público
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
