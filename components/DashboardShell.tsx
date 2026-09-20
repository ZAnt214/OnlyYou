"use client";

import { usePathname } from "next/navigation";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { isConversationScreenPath } from "@/lib/isConversationScreenPath";

/**
 * A conversa (/dashboard/pedidos-personalizados/[id]) é tela cheia própria
 * (ver ConversationScreen) — o wrapper com padding e o "← Painel" do resto
 * do painel não podem envolver ela, senão viram um segundo cabeçalho e um
 * segundo "voltar" por cima do da própria conversa, e o padding do wrapper
 * (sem altura própria) faz a página inteira rolar junto com a caixa de
 * mensagens em vez de só ela.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isConversationScreenPath(pathname)) return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
      <DashboardBackLink />
      {children}
    </div>
  );
}
