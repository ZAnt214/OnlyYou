export type ServiceRequestStatus = "open" | "closed";

/**
 * Publicação feita por quem precisa contratar. Diferente de CustomRequest,
 * ainda não aponta para um profissional específico: cada profissional que
 * demonstra interesse origina um CustomRequest/conversa próprio.
 */
export interface ServiceRequest {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  category: string;
  budgetCents?: number;
  desiredDeliveryDays?: number;
  status: ServiceRequestStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  requester?: {
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}
