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
  available: number;
  pending: number;
  withdrawn: number;
  currency: "BRL";
}

export type WithdrawalStatus =
  | "requested"
  | "pending"
  | "processing"
  | "paid"
  | "rejected"
  | "cancelled";

export interface Withdrawal {
  id: string;
  creatorId: string;
  amount: number;
  currency: "BRL";
  status: WithdrawalStatus;
  requestedAt: string;
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
