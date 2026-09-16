import type { Entitlement } from "@/lib/types";

export const entitlements: Entitlement[] = [
  {
    id: "ent-1001",
    userId: "user-b01",
    productId: "prod-001",
    orderId: "order-1001",
    status: "active",
    grantedAt: "2025-09-01T14:21:30.000Z",
  },
  {
    id: "ent-1002",
    userId: "user-b01",
    productId: "prod-003",
    orderId: "order-1002",
    status: "active",
    grantedAt: "2025-09-05T09:10:45.000Z",
  },
  {
    id: "ent-1003",
    userId: "user-b02",
    productId: "prod-009",
    orderId: "order-1003",
    status: "active",
    grantedAt: "2025-09-08T18:46:10.000Z",
  },
  {
    id: "ent-1004",
    userId: "user-b03",
    productId: "prod-004",
    orderId: "order-1005",
    status: "revoked",
    grantedAt: "2025-08-20T16:31:00.000Z",
  },
];
