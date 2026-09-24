"use client";

import { usePathname } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { isConversationScreenPath } from "@/lib/isConversationScreenPath";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isConversationScreenPath(pathname)) return <>{children}</>;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <DashboardNav variant="mobile" />

      <div className="mt-4 grid min-w-0 gap-6 md:mt-0 md:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden md:block">
          <div className="sticky top-20 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 shadow-sm">
            <div className="mb-4 border-b border-(--color-border) px-3 pb-3">
              <p className="text-sm font-semibold text-(--color-text)">Painel do criador</p>
              <p className="mt-0.5 text-xs text-(--color-text-subtle)">Seu trabalho, pedidos e dinheiro.</p>
            </div>
            <DashboardNav variant="desktop" />
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
