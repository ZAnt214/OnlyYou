"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import { ConversationView } from "@/components/ConversationView";

export default function MeuPedidoConversationPage() {
  const params = useParams<{ id: string }>();
  const session = useMockSession();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <Link
        href="/pedidos"
        className="flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text)"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Voltar
      </Link>
      <ConversationView customRequestId={params.id} actingUserId={session.currentUserId} />
    </div>
  );
}
