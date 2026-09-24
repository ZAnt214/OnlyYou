"use client";

import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { CustomRequestsList } from "@/components/CustomRequestsList";

export default function MeusPedidosPage() {
  const { userId } = useCurrentUserId();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-5">
      <CustomRequestsList userId={userId} role="all" />
    </div>
  );
}
