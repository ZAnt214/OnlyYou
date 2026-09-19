import { createClient } from "@/lib/supabase/client";
import { mapProfileRowToUser, type ProfileRow } from "@/lib/supabase/profile";
import { userRepository } from "@/lib/repositories/UserRepository";
import type { User } from "@/lib/types";

/**
 * Cada página do painel (Produtos, Vendas, Carteira, Cupons,
 * Estatísticas...) chama getCurrentCreatorClient() no próprio mount. Sem
 * cache, trocar de seção pelo hub significava repetir duas idas e voltas
 * de rede (auth + profiles) toda vez, mesmo tendo acabado de resolver a
 * mesma identidade um segundo antes na página anterior — é a causa real da
 * navegação entre seções do painel parecer lenta. Memoiza a promise em
 * módulo (dura enquanto a aba estiver aberta) e invalida sozinha em
 * login/logout.
 */
let cachedPromise: Promise<User> | null = null;
let listenerAttached = false;

async function resolveCreator(): Promise<User> {
  try {
    const supabase = createClient();
    // getSession() lê do armazenamento local (sem round-trip ao servidor
    // de auth) — suficiente aqui, já que isso só personaliza a tela; não é
    // uma decisão de autorização, essa continua sendo sempre aplicada pelo
    // RLS no banco, que nunca confia no que o cliente diz sobre si mesmo.
    const { data } = await supabase.auth.getSession();
    const authUser = data.session?.user;
    if (!authUser) {
      return userRepository.findMockCurrentCreator();
    }

    const { data: row, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error || !row) {
      return userRepository.findMockCurrentCreator();
    }

    return mapProfileRowToUser(row as ProfileRow);
  } catch {
    return userRepository.findMockCurrentCreator();
  }
}

/**
 * Equivalente client-side de "creator = (await getCurrentUser()) ??
 * findMockCurrentCreator()" usado nas páginas server de /dashboard.
 *
 * As telas de /dashboard que são Client Components ("use client", já
 * existiam assim antes desta integração — leem o SaleRepository/etc. via
 * useMockSession) não podem importar
 * lib/supabase/session.ts (server-only, usa next/headers). Este helper faz
 * a mesma resolução de identidade real-com-fallback-mock, mas usando o
 * cliente Supabase do navegador — mesmo padrão já usado em Header.tsx e
 * MockSessionProvider.
 *
 * app/dashboard/layout.tsx (Server Component) já garante que uma pessoa
 * real sem papel de criadora nunca chega a renderizar estas páginas.
 */
export async function getCurrentCreatorClient(): Promise<User> {
  if (!listenerAttached) {
    listenerAttached = true;
    createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        cachedPromise = null;
      }
    });
  }
  if (!cachedPromise) {
    cachedPromise = resolveCreator();
    cachedPromise.catch(() => {
      cachedPromise = null;
    });
  }
  return cachedPromise;
}
