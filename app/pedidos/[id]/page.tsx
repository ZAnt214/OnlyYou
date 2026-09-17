"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { ConversationView } from "@/components/ConversationView";

export default function MeuPedidoConversationPage() {
  const params = useParams<{ id: string }>();
  const { userId } = useCurrentUserId();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <Link
        href="/pedidos"
        className="flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text)"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Voltar
      </Link>
      <ConversationView customRequestId={params.id} actingUserId={userId} />
    </div>
  );
}
