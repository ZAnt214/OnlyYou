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
  /** Ganhos confirmados (payment_confirmations pagos) menos saques já
   * solicitados ou concluídos — o que ainda pode ser sacado agora. */
  availableCents: number;
  /** Total já ganho (histórico, pagos). */
  earnedCents: number;
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
