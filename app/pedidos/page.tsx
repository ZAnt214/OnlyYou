"use client";

import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import { CustomRequestsList } from "@/components/CustomRequestsList";

export default function MeusPedidosPage() {
  const session = useMockSession();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Mensagens</h1>
        <p className="text-sm text-(--color-text-muted)">
          Suas conversas e pedidos personalizados com profissionais da plataforma.
        </p>
      </div>
      <CustomRequestsList userId={session.currentUserId} role="requester" />
    </div>
  );
}
