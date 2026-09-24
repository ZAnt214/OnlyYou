"use client";

import { usePathname } from "next/navigation";
import { isConversationScreenPath } from "@/lib/isConversationScreenPath";

/**
 * pb-20 reserva espaço pro MobileNav flutuante — mas ele some nas telas de
 * conversa (ver Header/Footer/MobileNav), então esse padding sobraria como
 * um vão vazio embaixo da tela cheia de chat sem nenhum motivo.
 */
export function PageMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isConversation = isConversationScreenPath(pathname);

  return (
    <main
      className={`flex-1 ${
        isConversation
          ? ""
          : "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
      }`}
    >
      {children}
    </main>
  );
}
