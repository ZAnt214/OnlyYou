import Link from "next/link";
import { LayoutDashboard, Flag } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/denuncias", label: "Denúncias", icon: Flag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="flex-shrink-0 md:w-56">
        <p className="mb-2 px-3 text-xs uppercase tracking-wide text-(--color-text-subtle)">
          Administração
        </p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
            >
              <item.icon size={14} strokeWidth={1.5} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
