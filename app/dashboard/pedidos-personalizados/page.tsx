import { userRepository } from "@/lib/repositories/UserRepository";
import { CustomRequestsList } from "@/components/CustomRequestsList";
import { getCurrentUser } from "@/lib/supabase/session";

export default async function DashboardCustomRequestsPage() {
  // app/dashboard/layout.tsx já redireciona uma pessoa real sem papel de
  // criadora para fora do painel, então aqui só resolve qual identidade
  // usar (real, se logada; mock, como fallback de demo de sempre).
  const realUser = await getCurrentUser();
  const creator = realUser ?? (await userRepository.findMockCurrentCreator());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Pedidos personalizados</h1>
        <p className="text-sm text-(--color-text-muted)">
          Pedidos de conteúdo personalizado feitos pelos seus compradores.
        </p>
      </div>
      <CustomRequestsList userId={creator.id} role="creator" />
    </div>
  );
}
