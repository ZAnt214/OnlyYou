export type NotificationType =
  | "CUSTOM_REQUEST_CREATED"
  | "CUSTOM_MESSAGE_RECEIVED"
  | "CUSTOM_PROPOSAL_SENT"
  | "CUSTOM_PROPOSAL_ACCEPTED"
  | "CUSTOM_PROPOSAL_REJECTED"
  | "CUSTOM_PAYMENT_CONFIRMED"
  | "CUSTOM_SERVICE_STARTED"
  | "CUSTOM_DELIVERY_SENT"
  | "CUSTOM_SERVICE_COMPLETED"
  | "CUSTOM_ORDER_REVIEWED"
  | "CUSTOM_SERVICE_EXPIRED"
  | "CUSTOM_REFUND_CREATED"
  | "CUSTOM_DISPUTE_CREATED"
  | "WITHDRAWAL_PAID"
  | "WITHDRAWAL_REJECTED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Para onde o link "Ver pedido" leva. */
  linkHref?: string;
  read: boolean;
  createdAt: string;
}
