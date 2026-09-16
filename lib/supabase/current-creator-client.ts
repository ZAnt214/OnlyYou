import { createClient } from "@/lib/supabase/client";
import { mapProfileRowToUser, type ProfileRow } from "@/lib/supabase/profile";
import { userRepository } from "@/lib/repositories/UserRepository";
import type { User } from "@/lib/types";

/**
 * Equivalente client-side de "creator = (await getCurrentUser()) ??
 * findMockCurrentCreator()" usado nas páginas server de /dashboard.
 *
 * As telas de /dashboard que são Client Components ("use client", já
 * existiam assim antes desta integração — leem o SaleRepository/
 * WithdrawalRepository/etc. via useMockSession) não podem importar
 * lib/supabase/session.ts (server-only, usa next/headers). Este helper faz
 * a mesma resolução de identidade real-com-fallback-mock, mas usando o
 * cliente Supabase do navegador — mesmo padrão já usado em Header.tsx e
 * MockSessionProvider.
 *
 * app/dashboard/layout.tsx (Server Component) já garante que uma pessoa
 * real sem papel de criadora nunca chega a renderizar estas páginas.
 */
export async function getCurrentCreatorClient(): Promise<User> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const authUser = data.user;
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
