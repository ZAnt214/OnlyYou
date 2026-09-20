"use client";

import { useEffect, useState } from "react";
import { ConversationView } from "@/components/ConversationView";

/**
 * Altura real visível (descontando o teclado, quando aberto), lida direto
 * de `window.visualViewport` — a mesma técnica usada por apps de chat como
 * o WhatsApp Web. Depender de `100dvh`/`h-full` + o navegador redimensionar
 * o layout sozinho (`interactive-widget=resizes-content`) tentamos antes e
 * quebrou o layout em produção (o teclado some, mas alguns navegadores
 * recalculam a página de forma inconsistente, sobrepondo cabeçalho e
 * mensagens). Medir e aplicar a altura em pixel via JS é mais trabalho, mas
 * é o único jeito que se comporta igual em qualquer navegador.
 */
function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;

    function update() {
      setHeight(vv ? vv.height : window.innerHeight);
    }

    update();
    vv?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
}

/**
 * Tela cheia da conversa (cobre header/nav do site, que continuam montados
 * por trás) — usada tanto por app/pedidos/[id] quanto por
 * app/dashboard/pedidos-personalizados/[id]. Compartilhado pra manter a
 * mesma lógica de altura nos dois lugares em vez de duplicar.
 */
export function ConversationScreen({
  customRequestId,
  actingUserId,
  authLoading = false,
  backHref,
}: {
  customRequestId: string;
  actingUserId: string | null;
  authLoading?: boolean;
  backHref: string;
}) {
  const viewportHeight = useVisualViewportHeight();

  return (
    <div
      className="fixed inset-x-0 top-0 z-30 flex justify-center bg-(--color-bg)"
      style={{ height: viewportHeight ? `${viewportHeight}px` : "100dvh" }}
    >
      <div className="flex h-full w-full max-w-2xl flex-col px-4 py-4">
        <ConversationView
          customRequestId={customRequestId}
          actingUserId={actingUserId}
          authLoading={authLoading}
          backHref={backHref}
        />
      </div>
    </div>
  );
}
