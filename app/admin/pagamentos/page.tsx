import { requireAdmin } from "@/lib/security/adminAuth";

export const dynamic = "force-dynamic";
import { listPaymentConfirmationsForAdmin } from "@/lib/payments/adminPaymentConfirmations";
import { isRealPaymentProviderActive } from "@/lib/payments/getServerPaymentProvider";
import { auditLogRepository } from "@/lib/security/AuditLogRepository";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Estornado",
  chargeback: "Chargeback",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-(--color-warning)",
  processing: "text-(--color-warning)",
  paid: "text-(--color-success)",
  failed: "text-(--color-danger)",
  refunded: "text-(--color-text-muted)",
  chargeback: "text-(--color-danger)",
};

export default async function AdminPagamentosPage() {
  const admin = await requireAdmin();
  const [payments, realProviderActive] = await Promise.all([
    listPaymentConfirmationsForAdmin(),
    Promise.resolve(isRealPaymentProviderActive()),
  ]);

  await auditLogRepository.append({
    id: `audit-${crypto.randomUUID()}`,
    actorId: admin.id,
    action: "admin.view_payments",
    entityType: "payment_confirmations",
    entityId: "list",
    metadata: { count: payments.length },
    createdAt: new Date().toISOString(),
  });

  const totalGrossCents = payments.reduce((sum, p) => sum + (p.status === "paid" ? p.grossAmountCents : 0), 0);
  const totalPlatformFeeCents = payments.reduce(
    (sum, p) => sum + (p.status === "paid" ? p.platformFeeCents : 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Pagamentos</h1>
        <p className="text-sm text-(--color-text-muted)">
          Fonte: tabela <code>payment_confirmations</code> (Supabase), escrita só pelo backend a
          partir de confirmações reais do Mercado Pago. Provedor ativo:{" "}
          <span className="font-medium text-(--color-text)">
            {realProviderActive ? "Mercado Pago" : "Mock (sem credenciais configuradas)"}
          </span>
          .
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-(--color-border) p-4">
          <p className="text-xs text-(--color-text-subtle)">Total pago (bruto)</p>
          <p className="text-lg font-semibold text-(--color-text)">{formatBRLFromCents(totalGrossCents)}</p>
        </div>
        <div className="rounded-lg border border-(--color-border) p-4">
          <p className="text-xs text-(--color-text-subtle)">Comissão OnlyYou</p>
          <p className="text-lg font-semibold text-(--color-text)">
            {formatBRLFromCents(totalPlatformFeeCents)}
          </p>
        </div>
        <div className="rounded-lg border border-(--color-border) p-4">
          <p className="text-xs text-(--color-text-subtle)">Transações</p>
          <p className="text-lg font-semibold text-(--color-text)">{payments.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-(--color-border)">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-(--color-border) text-xs text-(--color-text-subtle)">
            <tr>
              <th className="px-3 py-2 font-medium">Pedido</th>
              <th className="px-3 py-2 font-medium">Payment ID</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Método</th>
              <th className="px-3 py-2 font-medium">Comprador</th>
              <th className="px-3 py-2 font-medium">Criador</th>
              <th className="px-3 py-2 font-medium">Bruto</th>
              <th className="px-3 py-2 font-medium">Comissão</th>
              <th className="px-3 py-2 font-medium">Criador recebe</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-(--color-text-subtle)">
                  Nenhum pagamento registrado ainda.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.mpPaymentId} className="border-b border-(--color-border) last:border-0">
                  <td className="px-3 py-2 text-(--color-text)">{p.orderId}</td>
                  <td className="px-3 py-2 text-(--color-text-muted)">{p.mpPaymentId}</td>
                  <td className="px-3 py-2 text-(--color-text-muted)">
                    {p.kind === "product" ? "Produto" : "Serviço personalizado"}
                  </td>
                  <td className="px-3 py-2 text-(--color-text-muted)">{p.method ?? "—"}</td>
                  <td className="px-3 py-2 text-(--color-text-muted)">{p.buyerUsername ?? "—"}</td>
                  <td className="px-3 py-2 text-(--color-text-muted)">{p.creatorUsername ?? "—"}</td>
                  <td className="px-3 py-2 text-(--color-text)">{formatBRLFromCents(p.grossAmountCents)}</td>
                  <td className="px-3 py-2 text-(--color-text-muted)">
                    {formatBRLFromCents(p.platformFeeCents)}
                  </td>
                  <td className="px-3 py-2 text-(--color-text-muted)">
                    {formatBRLFromCents(p.creatorAmountCents)}
                  </td>
                  <td className={`px-3 py-2 font-medium ${STATUS_COLOR[p.status] ?? ""}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </td>
                  <td className="px-3 py-2 text-(--color-text-subtle)">{formatDateTime(p.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
