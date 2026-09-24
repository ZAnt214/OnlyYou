import { requireAdmin } from "@/lib/security/adminAuth";
import { createServiceClient } from "@/lib/supabase/service";
import { listReportsForAdmin } from "@/lib/supabase/reports";
import { AdminReportsQueue } from "@/components/AdminReportsQueue";

export const dynamic = "force-dynamic";

export default async function AdminDenunciasPage() {
  await requireAdmin();
  const reports = await listReportsForAdmin(createServiceClient());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Denúncias</h1>
        <p className="text-sm text-(--color-text-muted)">
          Analise ocorrências reais enviadas pelos usuários, priorizadas por gravidade.
        </p>
      </div>

      <AdminReportsQueue initialReports={reports} />
    </div>
  );
}
