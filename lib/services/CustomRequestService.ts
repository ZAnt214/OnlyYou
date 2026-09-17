import type { User } from "@/lib/types";

/**
 * Estados de verificação em que um criador NÃO pode receber pedidos de
 * conteúdo personalizado. Usado tanto para esconder o botão na UI quanto
 * (principalmente) como validação server-side em create_custom_request()
 * (função RPC do Postgres, ver migração custom_requests_chat_rpc) — a UI
 * nunca é a única barreira.
 */
const INELIGIBLE_VERIFICATION_STATUSES = new Set(["suspended", "rejected"]);

export function isEligibleForCustomRequests(creator: Pick<User, "creatorProfile">): boolean {
  const status = creator.creatorProfile?.verificationStatus;
  if (!status) return false;
  return !INELIGIBLE_VERIFICATION_STATUSES.has(status);
}
