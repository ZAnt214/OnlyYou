import type { AuditLog } from "@/lib/types";
import { auditLogs } from "@/lib/data/audit-logs";

export interface AuditLogRepository {
  findAll(): Promise<AuditLog[]>;
  findByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
  append(log: AuditLog): Promise<AuditLog>;
}

let mockLogs: AuditLog[] = [...auditLogs];

export class MockAuditLogRepository implements AuditLogRepository {
  async findAll(): Promise<AuditLog[]> {
    return mockLogs;
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return mockLogs.filter((l) => l.entityType === entityType && l.entityId === entityId);
  }

  async append(log: AuditLog): Promise<AuditLog> {
    mockLogs = [...mockLogs, log];
    return log;
  }
}

export const auditLogRepository = new MockAuditLogRepository();
