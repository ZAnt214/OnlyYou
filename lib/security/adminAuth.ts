import { notFound } from "next/navigation";
import { userRepository } from "@/lib/repositories/UserRepository";

/**
 * Gate de autorização para toda a área /admin/*. Chamado a partir de
 * componentes de servidor (nunca de um guard client-side, que só
 * esconderia a UI sem impedir o acesso).
 *
 * TODO(integração): autenticação real e autorização server-side (sessão,
 * JWT, ou equivalente) — este check hoje usa um usuário mock fixo
 * (findMockCurrentAdmin()), não uma sessão autenticada de verdade.
 */
export async function requireAdmin() {
  const admin = await userRepository.findMockCurrentAdmin();
  if (!admin.roles.includes("admin")) {
    notFound();
  }
  return admin;
}
