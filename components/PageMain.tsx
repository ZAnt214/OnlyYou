"use client";

import { usePathname } from "next/navigation";
import { isConversationScreenPath } from "@/lib/isConversationScreenPath";

/**
 * pb-16 reserva espaço pro MobileNav flutuante — mas ele some nas telas de
 * conversa (ver Header/Footer/MobileNav), então esse padding sobraria como
 * um vão vazio embaixo da tela cheia de chat sem nenhum motivo.
 */
export function PageMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isConversation = isConversationScreenPath(pathname);

  return <main className={`flex-1 ${isConversation ? "" : "pb-16 md:pb-0"}`}>{children}</main>;
}
