export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface Coupon {
  id: string;
  creatorId: string;
  code: string;
  discountPercent: number;
  active: boolean;
  expiresAt?: string;
}
