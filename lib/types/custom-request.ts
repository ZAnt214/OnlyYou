/**
 * CustomRequest é o pedido de conteúdo personalizado feito por um comprador
 * a um criador. Ele nasce junto com uma Conversation (1:1) e evolui de
 * status conforme a negociação, proposta, pagamento e entrega avançam.
 *
 * Ver lib/types/conversation.ts, lib/types/custom-proposal.ts e
 * lib/types/custom-service-order.ts para as entidades relacionadas, e o
 * README ("Pedidos personalizados") para o fluxo completo.
 */
export type CustomRequestStatus =
  | "pending"
  | "negotiating"
  | "proposal_sent"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "completed"
  | "declined"
  | "cancelled"
  | "expired"
  | "refunded"
  | "disputed";

export interface CustomRequest {
  id: string;
  requesterId: string;
  creatorId: string;
  description: string;
  status: CustomRequestStatus;
  conversationId: string;
  /** Gig que originou o pedido, quando veio de "Solicitar" num anúncio — permite pré-preencher a proposta. */
  sourceGigId?: string;
  /** Oportunidade pública que originou a conversa, quando um profissional demonstrou interesse. */
  sourceServiceRequestId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  cancelledAt?: string;
}

export const CUSTOM_REQUEST_STATUS_LABELS: Record<CustomRequestStatus, string> = {
  pending: "Aguardando resposta",
  negotiating: "Em negociação",
  proposal_sent: "Proposta enviada",
  accepted: "Proposta aceita",
  in_progress: "Em produção",
  delivered: "Entregue",
  completed: "Concluído",
  declined: "Recusado",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
  disputed: "Em disputa",
};
