import { createClient } from "@/lib/supabase/server";
import { mapProfileRowToUser, type ProfileRow } from "@/lib/supabase/profile";
import type { User } from "@/lib/types";

/**
 * Resolução de identidade real (Supabase Auth) para uso em Server
 * Components/rotas. NUNCA importar este arquivo de um "use client" — ele
 * depende de lib/supabase/server.ts, que usa next/headers e quebra o build
 * se acabar no bundle do cliente. Componentes client que precisam da
 * identidade real (ex.: telas de dashboard client-side) devem usar o
 * cliente do navegador (lib/supabase/client.ts) diretamente, como o
 * Header.tsx já faz.
 *
 * Retorna `null` sempre que não há sessão utilizável — nunca lança, para
 * que os chamadores tratem isso como "visitante anônimo / sem conta" e
 * caiam no fluxo mock existente.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();

    // getClaims() (não getSession()) valida a assinatura do JWT a cada
    // chamada — é o que a orientação de segurança do Supabase recomenda
    // para checar autenticação no servidor (mesmo padrão já seguido em
    // lib/supabase/proxy.ts).
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return null;

    const userId = data.claims.sub;

    const { data: row, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !row) return null;

    return mapProfileRowToUser(row as ProfileRow);
  } catch {
    return null;
  }
}

/**
 * Busca pública de um perfil por username (usada na página de perfil do
 * criador). RLS permite SELECT público em `profiles`, então não depende de
 * haver sessão. Retorna `null` se não existir (nunca lança).
 */
export async function getProfileByUsername(username: string): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error || !row) return null;

    return mapProfileRowToUser(row as ProfileRow);
  } catch {
    return null;
  }
}
