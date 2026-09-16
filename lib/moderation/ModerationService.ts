import type { ProductStatus } from "@/lib/types";

/**
 * Regras de moderação de produtos. Nesta fase de mock, não há fila de
 * moderação operacional real — apenas as transições de status esperadas.
 */
export class ModerationService {
  submitForReview(): ProductStatus {
    return "pending_review";
  }

  approve(): ProductStatus {
    return "approved";
  }

  reject(): ProductStatus {
    return "rejected";
  }

  suspend(): ProductStatus {
    return "suspended";
  }
}

export const moderationService = new ModerationService();
