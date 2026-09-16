import type { Entitlement } from "@/lib/types";

/**
 * Regras de liberação de conteúdo (content-release). Centraliza a checagem
 * usada pelas páginas para decidir se o conteúdo de um produto pode ser
 * exibido a uma pessoa usuária. A fonte de verdade continua sendo
 * EntitlementService (lib/services/EntitlementService.ts) — este módulo só
 * expõe o predicado puro usado pela camada de apresentação.
 */
export function isContentReleased(entitlement: Entitlement | null | undefined): boolean {
  if (!entitlement) return false;
  if (entitlement.status !== "active") return false;
  if (entitlement.expiresAt && new Date(entitlement.expiresAt).getTime() < Date.now()) {
    return false;
  }
  return true;
}
