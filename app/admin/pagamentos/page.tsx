import { BadgeDollarSign, CreditCard, DollarSign } from "lucide-react";
import { requireAdmin } from "@/lib/security/adminAuth";
import { listPaymentConfirmationsForAdmin } from "@/lib/payments/adminPaymentConfirmations";
import { isRealPaymentProviderActive } from "@/lib/payments/getServerPaymentProvider";
import { auditLogRepository } from "@/lib/security/AuditLogRepository";
import { StatCard } from "@/components/StatCard";
import { AdminPaymentsList } from "@/components/AdminPaymentsList";

export const dynamic = "force-dynamic";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AdminPagamentosPage() {
  const admin = await requireAdmin();
  const [payments, realProviderActive] = await Promise.all([
    listPaymentConfirmationsForAdmin(100),
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

  const paid = payments.filter((payment) => payment.status === "paid");
  const grossCents = paid.reduce(
    (sum, payment) => sum + Number(payment.grossAmountCents ?? 0),
    0,
  );
  const feeCents = paid.reduce(
    (sum, payment) => sum + Number(payment.platformFeeCents ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-(--color-text)">Pagamentos</h1>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              realProviderActive
                ? "bg-(--color-surface-2) text-(--color-success)"
                : "bg-(--color-surface-2) text-(--color-warning)"
            }`}
          >
            {realProviderActive ? "Mercado Pago ativo" : "Provedor de teste"}
          </span>
        </div>
        <p className="text-sm text-(--color-text-muted)">
          Consulte pagamentos confirmados e detalhes financeiros sem abrir uma tabela extensa.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Volume pago"
          value={formatBRLFromCents(grossCents)}
          icon={DollarSign}
          hint="Nos registros carregados"
        />
        <StatCard
          label="Receita Jobê"
          value={formatBRLFromCents(feeCents)}
          icon={BadgeDollarSign}
          hint="Nos registros carregados"
        />
        <StatCard
          label="Transações"
          value={String(payments.length)}
          icon={CreditCard}
          hint="Até 100 mais recentes"
        />
      </div>

      <AdminPaymentsList payments={payments} />
    </div>
  );
}
