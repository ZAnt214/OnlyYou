/**
 * Registro simples de disputa aberta a partir de "Relatar problema" na
 * entrega de um pedido personalizado. Não há tela de gestão de disputas
 * completa nesta fase — apenas o registro e o reflexo do status no pedido
 * (CustomServiceOrder.status = "disputed" / CustomRequest.status = "disputed").
 */
export type DisputeStatus = "open" | "resolved" | "dismissed";

export interface Dispute {
  id: string;
  customServiceOrderId: string;
  customRequestId: string;
  raisedBy: string;
  reason: string;
  status: DisputeStatus;
  createdAt: string;
  resolvedAt?: string;
}
