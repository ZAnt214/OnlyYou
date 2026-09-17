export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "chargeback";

export type PaymentMethod = "credit_card" | "pix" | "boleto";

export interface Payment {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  currency: "BRL";
  method: PaymentMethod;
  createdAt: string;
  confirmedAt?: string;
  /** Dados de checkout do Mercado Pago capturados na criação (efêmeros). */
  checkoutRedirectUrl?: string;
  checkoutQrCode?: string;
  checkoutQrCodeBase64?: string;
  checkoutExpiresAt?: string;
}
