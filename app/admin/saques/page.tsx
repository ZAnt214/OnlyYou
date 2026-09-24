import { requireAdmin } from "@/lib/security/adminAuth";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { listAllWithdrawalsForAdmin } from "@/lib/supabase/wallet";
import { AdminWithdrawalsTable } from "@/components/AdminWithdrawalsTable";

export const dynamic = "force-dynamic";

export default async function AdminSaquesPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const withdrawals = await listAllWithdrawalsForAdmin(supabase);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Saques</h1>
        <p className="text-sm text-(--color-text-muted)">
          Revise as solicitações e marque como pago somente depois de concluir o Pix.
        </p>
      </div>
      <AdminWithdrawalsTable initialWithdrawals={withdrawals} />
    </div>
  );
}
