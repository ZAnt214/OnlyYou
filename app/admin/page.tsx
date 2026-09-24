import { createServiceClient } from "@/lib/supabase/service";
import { StatCard } from "@/components/StatCard";
import {
  BadgeDollarSign,
  DollarSign,
  Package,
  ShoppingCart,
  UserCheck,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/security/adminAuth";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const supabase = createServiceClient();

  const [
    usersResult,
    creatorsResult,
    productsResult,
    paidResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .contains("roles", ["creator"]),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("payment_confirmations")
      .select("gross_amount_cents, platform_fee_cents, creator_amount_cents")
      .eq("status", "paid"),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (creatorsResult.error) throw creatorsResult.error;
  if (productsResult.error) throw productsResult.error;
  if (paidResult.error) throw paidResult.error;

  const paidConfirmations = paidResult.data ?? [];
  const grossAmountCents = paidConfirmations.reduce(
    (sum, row) => sum + Number(row.gross_amount_cents ?? 0),
    0,
  );
  const platformFeeCents = paidConfirmations.reduce(
    (sum, row) => sum + Number(row.platform_fee_cents ?? 0),
    0,
  );
  const creatorAmountCents = paidConfirmations.reduce(
    (sum, row) => sum + Number(row.creator_amount_cents ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Visão geral</h1>
        <p className="text-sm text-(--color-text-muted)">
          Números reais da operação do Jobê. Pagamentos consideram somente
          transações confirmadas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Usuários"
          value={String(usersResult.count ?? 0)}
          icon={Users}
        />
        <StatCard
          label="Criadores"
          value={String(creatorsResult.count ?? 0)}
          icon={UserCheck}
        />
        <StatCard
          label="Produtos"
          value={String(productsResult.count ?? 0)}
          icon={Package}
        />
        <StatCard
          label="Vendas confirmadas"
          value={String(paidConfirmations.length)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Volume pago"
          value={formatBRLFromCents(grossAmountCents)}
          icon={DollarSign}
          hint="Total pago pelos clientes"
        />
        <StatCard
          label="Receita do Jobê"
          value={formatBRLFromCents(platformFeeCents)}
          icon={BadgeDollarSign}
          hint="Taxas da plataforma"
        />
      </div>

      <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
          Distribuição dos pagamentos
        </p>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-(--color-text-muted)">
              Repassado aos criadores
            </p>
            <p className="mt-1 text-xl font-bold text-(--color-text)">
              {formatBRLFromCents(creatorAmountCents)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-(--color-text-muted)">Jobê</p>
            <p className="mt-1 text-xl font-bold text-(--color-accent-text)">
              {formatBRLFromCents(platformFeeCents)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
