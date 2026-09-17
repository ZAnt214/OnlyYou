"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Id do usuário Supabase Auth real logado no navegador, ou `null` enquanto
 * carrega/se não há sessão. Usado pelas telas de pedidos personalizados/chat
 * (lib/supabase/customRequests.ts), que agora exigem conta real — sem
 * fallback para usuário mock, diferente do resto do app ainda em transição.
 */
export function useCurrentUserId(): { userId: string | null; loading: boolean } {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { userId, loading };
}
