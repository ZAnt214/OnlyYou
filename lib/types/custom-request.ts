export type CustomRequestStatus = "pending" | "accepted" | "declined" | "delivered";

export interface CustomRequest {
  id: string;
  buyerId: string;
  creatorId: string;
  description: string;
  budget?: number;
  status: CustomRequestStatus;
  createdAt: string;
}

export const CUSTOM_REQUEST_STATUS_LABELS: Record<CustomRequestStatus, string> = {
  pending: "Aguardando resposta",
  accepted: "Aceito pelo criador",
  declined: "Recusado",
  delivered: "Entregue",
};
