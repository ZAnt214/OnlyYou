import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { CustomRequestsList } from "@/components/CustomRequestsList";
import { getCurrentUser } from "@/lib/supabase/session";

export default async function DashboardCustomRequestsPage() {
  const realUser = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Trabalho"
        title="Pedidos"
        description="Conversas, propostas e trabalhos personalizados que chegaram até você."
      />
      <CustomRequestsList userId={realUser?.id ?? null} role="creator" />
    </div>
  );
}
