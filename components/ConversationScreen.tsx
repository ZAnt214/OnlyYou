"use client";

import { useEffect, useState } from "react";
import { ConversationView } from "@/components/ConversationView";

/**
 * Altura real visível (descontando o teclado, quando aberto), lida direto
 * de `window.visualViewport`. Antes esta tela usava `position: fixed`
 * pra cobrir o header/nav do site por trás — só que um elemento `fixed`
 * fica ancorado ao viewport de *layout*, não ao *visual* (o que a pessoa
 * realmente vê), e o Android desloca um em relação ao outro ao focar um
 * campo dentro de um `fixed` pra tentar trazê-lo pra vista. Isso causava
 * sobreposição de conteúdo mesmo já compensando altura e `offsetTop`.
 * A correção de raiz foi header/footer/nav sumirem sozinhos nesta rota
 * (ver Header/Footer/MobileNav + isConversationScreenPath) — sem nada
 * pra "cobrir", este container volta a ser um bloco normal do documento,
 * e o problema de `fixed` deixa de existir por completo.
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
 * Tela cheia da conversa — usada tanto por app/pedidos/[id] quanto por
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
      className="mx-auto flex w-full max-w-2xl flex-col px-4 py-4"
      style={{ height: viewportHeight ? `${viewportHeight}px` : "100dvh" }}
    >
      <ConversationView
        customRequestId={customRequestId}
        actingUserId={actingUserId}
        authLoading={authLoading}
        backHref={backHref}
      />
    </div>
  );
}
