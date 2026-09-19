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

    // getSession() lê do armazenamento local em vez de ir ao servidor de
    // auth a cada mount — cada tela que usa este hook fazia essa ida e
    // volta de rede de novo, mesmo tendo acabado de resolver a mesma
    // sessão na tela anterior (getUser() sempre revalida contra o
    // servidor; aqui isso não é uma decisão de autorização, então não
    // precisa).
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.session?.user?.id ?? null);
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
