import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { mapProfileRowToUser, type ProfileRow } from "@/lib/supabase/profile";
import type { User } from "@/lib/types";

/**
 * O proxy (lib/supabase/proxy.ts) já roda getClaims() pra praticamente toda
 * request e repassa o id verificado neste header — chamar getClaims() de
 * novo aqui pagaria uma segunda ida à rede ao servidor de auth do Supabase
 * pro MESMO token (JWT HS256 deste projeto não verifica localmente, cai no
 * getUser() do auth-js). O header só chega até aqui através do objeto de
 * request que o próprio middleware construiu, então não é falsificável pelo
 * cliente. Some apenas se o matcher do proxy não cobrir a rota (não é o
 * caso hoje) — nesse caso cai no getClaims() como rede de segurança.
 */
async function getVerifiedUserId(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get("x-verified-user-id");
}

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

    let userId = await getVerifiedUserId();
    if (!userId) {
      // getClaims() (não getSession()) valida a assinatura do JWT a cada
      // chamada — é o que a orientação de segurança do Supabase recomenda
      // para checar autenticação no servidor (mesmo padrão já seguido em
      // lib/supabase/proxy.ts).
      const { data, error } = await supabase.auth.getClaims();
      if (error || !data?.claims?.sub) return null;
      userId = data.claims.sub;
    }

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
 * Só o id do usuário autenticado, sem buscar a linha de `profiles` — pra
 * quando o chamador só precisa comparar "é esta pessoa mesma?" (ex.:
 * isOwnProfile) e a busca completa de getCurrentUser() seria uma consulta
 * ao banco desperdiçada. getClaims() já valida o JWT localmente; não faz
 * nenhuma ida a mais à rede além dessa validação.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const verified = await getVerifiedUserId();
    if (verified) return verified;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return null;
    return data.claims.sub;
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
