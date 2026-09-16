import { reportRepository } from "@/lib/repositories/ReportRepository";
import { StatusBadge } from "@/components/StatusBadge";
import { REPORT_REASON_LABELS, type ReportStatus } from "@/lib/types";
import { requireAdmin } from "@/lib/security/adminAuth";

const GROUPS: { status: ReportStatus; label: string }[] = [
  { status: "open", label: "Abertas" },
  { status: "under_review", label: "Em análise" },
  { status: "resolved", label: "Resolvidas" },
  { status: "dismissed", label: "Arquivadas" },
];

const PRIORITY_LABEL: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export default async function AdminDenunciasPage() {
  await requireAdmin();
  const reports = await reportRepository.findAll();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Denúncias</h1>
        <p className="text-sm text-(--color-text-muted)">
          Fila agrupada por status e priorizada por gravidade.
        </p>
      </div>

      {GROUPS.map((group) => {
        const items = reports.filter((r) => r.status === group.status);
        return (
          <section key={group.status} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-(--color-text)">
              {group.label} ({items.length})
            </h2>
            {items.length === 0 ? (
              <p className="text-sm text-(--color-text-muted)">Nenhuma denúncia nesta fila.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-(--color-border)">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-subtle)">
                      <th className="px-4 py-2 font-medium">Motivo</th>
                      <th className="px-4 py-2 font-medium">Alvo</th>
                      <th className="px-4 py-2 font-medium">Prioridade</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.id} className="border-b border-(--color-border) last:border-0">
                        <td className="px-4 py-3 text-(--color-text)">{REPORT_REASON_LABELS[r.reason]}</td>
                        <td className="px-4 py-3 text-(--color-text-muted)">
                          {r.targetType === "product" ? "Produto" : "Usuário"} · {r.targetId}
                        </td>
                        <td className="px-4 py-3 text-(--color-text-muted)">
                          {PRIORITY_LABEL[r.priority]}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
