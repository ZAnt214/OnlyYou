"use client";

import { useParams } from "next/navigation";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { ConversationView } from "@/components/ConversationView";

export default function MeuPedidoConversationPage() {
  const params = useParams<{ id: string }>();
  const { userId, loading: authLoading } = useCurrentUserId();

  // Tela cheia como uma página própria (cobre header/nav do site, que
  // continuam montados por trás) — botão de voltar vive no cabeçalho do
  // próprio ConversationView.
  return (
    <div className="fixed inset-0 z-30 flex justify-center bg-(--color-bg)">
      <div className="flex h-full w-full max-w-2xl flex-col px-4 py-4">
        <ConversationView
          customRequestId={params.id}
          actingUserId={userId}
          authLoading={authLoading}
          backHref="/pedidos"
        />
      </div>
    </div>
  );
}
