"use client";

import { useEffect, useState } from "react";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";

/**
 * Username usado pelos links de "Área do criador" (Header e MobileNav).
 *
 * Isto existia como prop vinda do layout raiz, que chamava getCurrentUser()
 * — ou seja, lia cookies no root layout. Ler cookies ali força TODA rota do
 * app a ser renderizada dinamicamente a cada request: nem `/sobre`,
 * `/termos` ou a home conseguiam ser estáticas/cacheadas, e cada prefetch
 * de `<Link>` virava uma invocação serverless completa (visível nos logs da
 * Vercel como `cache=MISS` em dezenas de rotas por segundo).
 *
 * Resolvendo no cliente, o layout raiz volta a ser estático. Começa já com
 * o criador mock (lookup local e síncrono, mesmo fallback que o layout
 * usava quando não havia sessão), então o link nunca nasce quebrado, e
 * troca pelo username real assim que a sessão resolve — a busca em si é
 * memoizada em getCurrentCreatorClient(), então Header e MobileNav
 * compartilham a mesma, sem duplicar rede.
 */
export function useCreatorUsername(): string | null {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentCreatorClient()
      .then((user) => {
        if (!cancelled) setUsername(user.username);
      })
      .catch(() => {
        if (!cancelled) setUsername(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return username;
}
