import { createClient } from "@/lib/supabase/client";
import { mapProfileRowToUser, type ProfileRow } from "@/lib/supabase/profile";
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
  const supabase = createClient();
  // getSession() lê do armazenamento local (sem round-trip ao servidor
  // de auth) — suficiente aqui, já que o layout do dashboard já validou a
  // identidade no servidor e o banco continua aplicando RLS.
  const { data } = await supabase.auth.getSession();
  const authUser = data.session?.user;
  if (!authUser) throw new Error("Sessão necessária para acessar a área do criador.");

  const { data: row, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (error || !row) throw new Error("Perfil autenticado não encontrado.");

  const user = mapProfileRowToUser(row as ProfileRow);
  if (!user.creatorProfile) throw new Error("A conta ainda não é creator.");
  return user;
}

/**
 * As telas de /dashboard que são Client Components ("use client", já
 * existiam assim antes desta integração — leem o SaleRepository/etc. via
 * useMockSession) não podem importar
 * lib/supabase/session.ts (server-only, usa next/headers). Este helper
 * resolve somente a identidade real do Supabase no navegador.
 *
 * app/dashboard/layout.tsx garante que visitantes e compradores comuns
 * nunca chegam a renderizar estas páginas.
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
