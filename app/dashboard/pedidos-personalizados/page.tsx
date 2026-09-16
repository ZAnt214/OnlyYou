import { userRepository } from "@/lib/repositories/UserRepository";
import { CustomRequestsList } from "@/components/CustomRequestsList";

export default async function DashboardCustomRequestsPage() {
  const creator = await userRepository.findMockCurrentCreator();

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
