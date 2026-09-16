import type { Report, ReportReason, ReportTargetType } from "@/lib/types";
import { reportRepository, type ReportRepository } from "@/lib/repositories/ReportRepository";

export class ReportService {
  constructor(private reportRepo: ReportRepository) {}

  async fileReport(params: {
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    description: string;
    customRequestId?: string;
    conversationId?: string;
  }): Promise<Report> {
    const priority: Report["priority"] =
      params.reason === "minor_content" || params.reason === "illegal_content"
        ? "urgent"
        : params.reason === "non_consensual_content" || params.reason === "stolen_content"
          ? "high"
          : "normal";

    const report: Report = {
      id: `rep-${Date.now()}`,
      reporterId: params.reporterId,
      targetType: params.targetType,
      targetId: params.targetId,
      reason: params.reason,
      description: params.description,
      customRequestId: params.customRequestId,
      conversationId: params.conversationId,
      status: "open",
      priority,
      createdAt: new Date().toISOString(),
    };

    return this.reportRepo.create(report);
  }

  async queueGroupedByStatus(): Promise<Record<Report["status"], Report[]>> {
    const all = await this.reportRepo.findAll();
    return {
      open: all.filter((r) => r.status === "open"),
      under_review: all.filter((r) => r.status === "under_review"),
      resolved: all.filter((r) => r.status === "resolved"),
      dismissed: all.filter((r) => r.status === "dismissed"),
    };
  }
}

export const reportService = new ReportService(reportRepository);
