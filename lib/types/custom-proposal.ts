export type CustomProposalStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "cancelled";

/**
 * Valores monetários em centavos (inteiro) — diferente de Order/Payment/Sale,
 * que usam reais em ponto flutuante. Ver README para a justificativa dessa
 * inconsistência (não corrigida retroativamente nas entidades antigas).
 */
export interface CustomProposal {
  id: string;
  customRequestId: string;
  conversationId: string;
  creatorId: string;
  requesterId: string;
  serviceType: string;
  description: string;
  priceCents: number;
  currency: "BRL";
  /** Prazo em dias combinado na criação da proposta. */
  deliveryDays: number;
  /** Data-limite calculada (ISO) — só existe depois que a proposta é aceita/paga. */
  deliveryDeadlineAt?: string;
  status: CustomProposalStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  expiresAt?: string;
}

export const CUSTOM_PROPOSAL_STATUS_LABELS: Record<CustomProposalStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  accepted: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
  cancelled: "Cancelada",
};
