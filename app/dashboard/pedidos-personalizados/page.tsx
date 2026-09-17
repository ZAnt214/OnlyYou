import { CustomRequestsList } from "@/components/CustomRequestsList";
import { getCurrentUser } from "@/lib/supabase/session";

export default async function DashboardCustomRequestsPage() {
  // Pedidos personalizados/chat agora vivem no Supabase (ver
  // lib/supabase/customRequests.ts) — exigem conta real, sem fallback
  // mock: passar null faz CustomRequestsList pedir login em vez de tentar
  // ler dados de um id mock que não existe nas tabelas reais.
  const realUser = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Pedidos personalizados</h1>
        <p className="text-sm text-(--color-text-muted)">
          Pedidos de conteúdo personalizado feitos pelos seus compradores.
        </p>
      </div>
      <CustomRequestsList userId={realUser?.id ?? null} role="creator" />
    </div>
  );
}
