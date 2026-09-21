type Tone = "neutral" | "positive" | "warning" | "negative";

// "positive" usa o mesmo padrão dos chips ativos (bg-accent-soft +
// text-accent) em vez de --color-success: verde destoa da paleta
// laranja+cinza do Jobê. Ver CLAUDE.md — não reintroduzir verde aqui.
const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-(--color-surface-2) text-(--color-text-muted)",
  positive: "bg-(--color-accent-soft) text-(--color-accent-text)",
  warning: "bg-(--color-surface-2) text-(--color-warning)",
  negative: "bg-(--color-surface-2) text-(--color-danger)",
};

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  // Produto (moderação)
  draft: { label: "Rascunho", tone: "neutral" },
  pending_review: { label: "Em análise", tone: "warning" },
  approved: { label: "Aprovado", tone: "positive" },
  rejected: { label: "Rejeitado", tone: "negative" },
  suspended: { label: "Suspenso", tone: "negative" },
  removed: { label: "Removido", tone: "negative" },
  // Pedido
  pending: { label: "Pendente", tone: "warning" },
  paid: { label: "Pago", tone: "positive" },
  cancelled: { label: "Cancelado", tone: "negative" },
  refunded: { label: "Reembolsado", tone: "neutral" },
  // Pagamento
  processing: { label: "Processando", tone: "warning" },
  failed: { label: "Falhou", tone: "negative" },
  chargeback: { label: "Chargeback", tone: "negative" },
  // Verificação
  unverified: { label: "Não verificado", tone: "neutral" },
  verified: { label: "Verificado", tone: "positive" },
  // Saque
  requested: { label: "Solicitado", tone: "warning" },
  // "paid"/"processing"/"rejected"/"cancelled" já cobertos acima
  // Denúncia
  open: { label: "Aberta", tone: "warning" },
  under_review: { label: "Em análise", tone: "warning" },
  resolved: { label: "Resolvida", tone: "positive" },
  dismissed: { label: "Arquivada", tone: "neutral" },
  // Entitlement
  active: { label: "Ativo", tone: "positive" },
  revoked: { label: "Revogado", tone: "negative" },
  expired: { label: "Expirado", tone: "neutral" },
  // Pedido personalizado / conversa / proposta / contratação
  // ("pending"/"paid"/"cancelled"/"refunded"/"expired" já cobertos acima)
  negotiating: { label: "Em negociação", tone: "warning" },
  proposal_sent: { label: "Proposta enviada", tone: "warning" },
  sent: { label: "Enviada", tone: "warning" },
  accepted: { label: "Aceita", tone: "positive" },
  awaiting_payment: { label: "Aguardando pagamento", tone: "warning" },
  in_progress: { label: "Em produção", tone: "warning" },
  delivered: { label: "Entregue", tone: "positive" },
  completed: { label: "Concluído", tone: "positive" },
  declined: { label: "Recusado", tone: "negative" },
  disputed: { label: "Em disputa", tone: "negative" },
  closed: { label: "Encerrada", tone: "neutral" },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, tone: "neutral" as Tone };
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[entry.tone]}`}
    >
      {entry.label}
    </span>
  );
}
