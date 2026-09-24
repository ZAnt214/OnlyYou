import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Report,
  ReportPriority,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@/lib/types";

interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description: string;
  evidence: string | null;
  status: ReportStatus;
  priority: ReportPriority;
  custom_request_id: string | null;
  conversation_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  decision: string | null;
}

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    description: row.description,
    evidence: row.evidence ?? undefined,
    status: row.status,
    priority: row.priority,
    customRequestId: row.custom_request_id ?? undefined,
    conversationId: row.conversation_id ?? undefined,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    decision: row.decision ?? undefined,
  };
}

export async function listReportsForAdmin(
  supabase: SupabaseClient,
): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ReportRow[]).map(mapReport);
}

export async function createReport(
  supabase: SupabaseClient,
  input: {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    description: string;
    customRequestId?: string;
    conversationId?: string;
    evidence?: string;
  },
): Promise<Report> {
  const { data, error } = await supabase
    .rpc("create_report", {
      p_target_type: input.targetType,
      p_target_id: input.targetId,
      p_reason: input.reason,
      p_description: input.description,
      p_custom_request_id: input.customRequestId ?? null,
      p_conversation_id: input.conversationId ?? null,
      p_evidence: input.evidence ?? null,
    })
    .single();

  if (error) throw new Error(error.message);
  return mapReport(data as ReportRow);
}

export async function reviewReport(
  supabase: SupabaseClient,
  input: {
    reportId: string;
    status: ReportStatus;
    decision?: string;
  },
): Promise<Report> {
  const { data, error } = await supabase
    .rpc("review_report", {
      p_report_id: input.reportId,
      p_status: input.status,
      p_decision: input.decision ?? null,
    })
    .single();

  if (error) throw new Error(error.message);
  return mapReport(data as ReportRow);
}
