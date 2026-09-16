import type { Report } from "@/lib/types";
import { reports } from "@/lib/data/reports";

export interface ReportRepository {
  findAll(): Promise<Report[]>;
  findById(id: string): Promise<Report | null>;
  findByStatus(status: Report["status"]): Promise<Report[]>;
  create(report: Report): Promise<Report>;
}

let mockReports: Report[] = [...reports];

export class MockReportRepository implements ReportRepository {
  async findAll(): Promise<Report[]> {
    return mockReports;
  }

  async findById(id: string): Promise<Report | null> {
    return mockReports.find((r) => r.id === id) ?? null;
  }

  async findByStatus(status: Report["status"]): Promise<Report[]> {
    return mockReports.filter((r) => r.status === status);
  }

  async create(report: Report): Promise<Report> {
    mockReports = [...mockReports, report];
    return report;
  }
}

export const reportRepository = new MockReportRepository();
