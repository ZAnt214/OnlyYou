export interface Sale {
  id: string;
  orderId: string;
  paymentId: string;
  productId: string;
  creatorId: string;
  grossAmount: number;
  platformFee: number;
  creatorAmount: number;
  currency: "BRL";
  createdAt: string;
}

export interface CreatorBalance {
  creatorId: string;
  /** Total confirmado em pagamentos pagos, inclusive valores ainda não liberados para saque. */
  earnedCents: number;
  /** Parte dos ganhos que já cumpre as regras de liberação para saque. */
  eligibleCents: number;
  /** Ganhos confirmados ainda bloqueados para saque, por exemplo serviço ainda não concluído. */
  pendingReleaseCents: number;
  /** Saques solicitados ou já concluídos, portanto já reservados do saldo elegível. */
  reservedCents: number;
  /** O que pode ser solicitado agora. */
  availableCents: number;
  /** Soma de saques com status "paid" — já transferidos de verdade. */
  withdrawnCents: number;
  currency: "BRL";
}

export type WithdrawalStatus = "requested" | "paid" | "rejected";

export type PixKeyType = "cpf" | "email" | "phone" | "random";

export interface Withdrawal {
  id: string;
  creatorId: string;
  amountCents: number;
  currency: "BRL";
  pixKeyType: PixKeyType;
  pixKey: string;
  status: WithdrawalStatus;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  adminNotes: string | null;
}

export interface Refund {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: "BRL";
  reason: string;
  status: string;
  createdAt: string;
}
