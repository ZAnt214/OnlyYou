export type EntitlementStatus = "active" | "revoked" | "expired";

export interface Entitlement {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  status: EntitlementStatus;
  grantedAt: string;
  expiresAt?: string;
}
