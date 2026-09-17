"use client";

import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { CustomRequestsList } from "@/components/CustomRequestsList";

export default function MeusPedidosPage() {
  const { userId } = useCurrentUserId();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <div className="flex flex-col gap-1 rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-center">
        <h1 className="text-base font-bold text-(--color-text)">Mensagens</h1>
        <p className="text-sm text-(--color-text-muted)">
          Suas conversas e pedidos personalizados com profissionais da plataforma.
        </p>
      </div>
      <CustomRequestsList userId={userId} role="all" />
    </div>
  );
}
