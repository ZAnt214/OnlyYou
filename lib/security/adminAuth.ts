import { notFound } from "next/navigation";
import { userRepository } from "@/lib/repositories/UserRepository";
import { getCurrentUser } from "@/lib/supabase/session";

/**
 * Gate de autorização para toda a área /admin/*. Chamado a partir de
 * componentes de servidor (nunca de um guard client-side, que só
 * esconderia a UI sem impedir o acesso).
 *
 * Com sessão Supabase real, verifica profiles.roles de quem está logado —
 * roles é uma coluna com UPDATE revogado de `authenticated` (ver migration
 * de public.profiles), então ninguém consegue se autopromover a admin pela
 * API pública; só um processo com acesso direto ao banco altera isso.
 * Sem sessão real, cai no admin mock de sempre (comportamento de demo
 * inalterado).
 *
 * TODO(integração): quando existirem outros papéis administrativos
 * (moderator, support), refinar essa checagem além de só
 * `roles.includes("admin")`.
 */
export async function requireAdmin() {
  const realUser = await getCurrentUser();
  const admin = realUser ?? (await userRepository.findMockCurrentAdmin());
  if (!admin.roles.includes("admin")) {
    notFound();
  }
  return admin;
}
