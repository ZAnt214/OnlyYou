import type { AuditLog } from "@/lib/types";

export const auditLogs: AuditLog[] = [
  {
    id: "audit-6001",
    actorId: "user-admin01",
    action: "report.resolve",
    entityType: "report",
    entityId: "rep-4002",
    metadata: { decision: "conta_suspensa" },
    createdAt: "2025-08-29T14:00:00.000Z",
  },
  {
    id: "audit-6002",
    actorId: "user-c01",
    action: "product.publish",
    entityType: "product",
    entityId: "prod-002",
    metadata: { status: "pending_review" },
    createdAt: "2025-08-10T10:00:00.000Z",
  },
  {
    id: "audit-6003",
    actorId: "user-admin01",
    action: "product.suspend",
    entityType: "product",
    entityId: "prod-012",
    metadata: { reason: "stolen_content" },
    createdAt: "2025-09-11T09:00:00.000Z",
  },
];
