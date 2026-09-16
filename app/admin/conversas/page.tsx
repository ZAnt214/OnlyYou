import { requireAdmin } from "@/lib/security/adminAuth";
import { AdminConversationsTable } from "@/components/AdminConversationsTable";

export default async function AdminConversasPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Conversas</h1>
        <p className="text-sm text-(--color-text-muted)">
          Conversas de pedidos personalizados entre compradores e criadores.
        </p>
      </div>
      <AdminConversationsTable />
    </div>
  );
}
