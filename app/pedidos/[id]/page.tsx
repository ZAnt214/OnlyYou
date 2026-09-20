"use client";

import { useParams } from "next/navigation";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { ConversationScreen } from "@/components/ConversationScreen";

export default function MeuPedidoConversationPage() {
  const params = useParams<{ id: string }>();
  const { userId, loading: authLoading } = useCurrentUserId();

  return (
    <ConversationScreen
      customRequestId={params.id}
      actingUserId={userId}
      authLoading={authLoading}
      backHref="/pedidos"
    />
  );
}
