import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/security/adminAuth";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-full bg-(--color-bg)">
      <header className="border-b border-(--color-border) bg-(--color-surface)">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-(--color-text) text-(--color-accent)">
              <ShieldCheck size={20} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-bold text-(--color-text)">Central Jobê</p>
                <span className="rounded-full bg-(--color-accent-soft) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-(--color-accent-text)">
                  Admin
                </span>
              </div>
              <p className="truncate text-xs text-(--color-text-muted)">
                Operação, pagamentos e segurança da plataforma
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-(--color-border) px-3.5 py-2 text-xs font-medium text-(--color-text) transition-colors hover:bg-(--color-surface-2)"
          >
            <ArrowLeft size={14} strokeWidth={1.7} />
            <span className="hidden sm:inline">Voltar ao Jobê</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-7 md:py-7 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="md:sticky md:top-5">
            <div className="mb-3 hidden px-3 md:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-subtle)">
                Administração
              </p>
              <p className="mt-1 truncate text-xs text-(--color-text-muted)">
                {admin.displayName || admin.username}
              </p>
            </div>
            <AdminNav />
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
