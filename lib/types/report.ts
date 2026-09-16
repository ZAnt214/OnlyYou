export type ReportTargetType = "product" | "user" | "message" | "conversation";

export type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";

export type ReportPriority = "low" | "normal" | "high" | "urgent";

export type ReportReason =
  | "illegal_content"
  | "minor_content"
  | "non_consensual_content"
  | "stolen_content"
  | "copyright_violation"
  | "fake_profile"
  | "fraud"
  | "other";

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  evidence?: string;
  status: ReportStatus;
  priority: ReportPriority;
  /** Presentes quando o alvo é uma mensagem ou conversa do fluxo de pedidos personalizados. */
  customRequestId?: string;
  conversationId?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  decision?: string;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  illegal_content: "Conteúdo ilegal",
  minor_content: "Conteúdo envolvendo menor",
  non_consensual_content: "Conteúdo não consensual",
  stolen_content: "Conteúdo roubado",
  copyright_violation: "Violação de direitos autorais",
  fake_profile: "Perfil falso",
  fraud: "Fraude",
  other: "Outro",
};
