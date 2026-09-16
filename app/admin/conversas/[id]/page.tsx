import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/security/adminAuth";
import { AdminConversationDetail } from "@/components/AdminConversationDetail";

export default async function AdminConversaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/conversas"
        className="flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text)"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Voltar
      </Link>
      <h1 className="text-xl font-semibold text-(--color-text)">Conversa — {id}</h1>
      <AdminConversationDetail customRequestId={id} adminId={admin.id} />
    </div>
  );
}
