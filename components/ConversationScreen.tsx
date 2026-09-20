"use client";

import { useEffect, useState } from "react";
import { ConversationView } from "@/components/ConversationView";

/**
 * Altura E posição reais da área visível (descontando o teclado, quando
 * aberto), lidas direto de `window.visualViewport`. Só ajustar a altura
 * (primeira tentativa) não resolveu: no Android, quando o teclado abre e um
 * campo dentro de um elemento `fixed` ganha foco, o navegador rola a
 * PÁGINA pra tentar trazer o campo pra vista — isso desloca o *visual*
 * viewport (o que a pessoa realmente vê) pra baixo, mas um elemento
 * `position: fixed` continua ancorado ao *layout* viewport (que não se
 * move). Resultado: a tela "escorregava" pra cima em relação ao que estava
 * visível, sobrepondo cabeçalho e mensagens. `visualViewport.offsetTop` é
 * exatamente esse deslocamento — aplicado em `top`, o container passa a
 * seguir o viewport visual de verdade, não só o de layout.
 */
function useVisualViewport(): { height: number | null; offsetTop: number } {
  const [height, setHeight] = useState<number | null>(null);
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;

    function update() {
      setHeight(vv ? vv.height : window.innerHeight);
      setOffsetTop(vv ? vv.offsetTop : 0);
    }

    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { height, offsetTop };
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
  const { height: viewportHeight, offsetTop } = useVisualViewport();

  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center bg-(--color-bg)"
      style={{
        top: `${offsetTop}px`,
        height: viewportHeight ? `${viewportHeight}px` : "100dvh",
      }}
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
