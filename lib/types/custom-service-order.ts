export type CustomServiceOrderStatus =
  | "awaiting_payment"
  | "paid"
  | "in_progress"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed"
  | "expired";

/**
 * A contratação efetiva de um serviço personalizado, criada a partir de uma
 * CustomProposal aceita. Liga-se ao Order/Payment "genéricos" já existentes
 * (mesma infraestrutura de checkout do marketplace) via orderId/paymentId.
 */
export interface CustomServiceOrder {
  id: string;
  customRequestId: string;
  proposalId: string;
  orderId: string;
  paymentId?: string;
  requesterId: string;
  creatorId: string;
  serviceType: string;
  description: string;
  agreedAmountCents: number;
  currency: "BRL";
  deliveryDeadlineAt: string;
  /** Herdado da proposta: até quando o pagamento pode ser concluído (ISO). */
  paymentDueAt?: string;
  status: CustomServiceOrderStatus;
  createdAt: string;
  startedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  refundedAt?: string;
}

export const CUSTOM_SERVICE_ORDER_STATUS_LABELS: Record<CustomServiceOrderStatus, string> = {
  awaiting_payment: "Aguardando pagamento",
  paid: "Pago",
  in_progress: "Em produção",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  disputed: "Em disputa",
  expired: "Expirado",
};
