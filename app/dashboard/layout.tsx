import { redirect } from "next/navigation";
import { userRepository } from "@/lib/repositories/UserRepository";
import { getCurrentUser } from "@/lib/supabase/session";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Sessão real sem papel de criadora ainda -> nunca mostra o painel mock
  // de outra pessoa; manda para o próprio perfil, que exibe o convite para
  // se tornar criadora. Sem sessão real, cai no fallback de demo de sempre.
  const realUser = await getCurrentUser();
  if (realUser && !realUser.creatorProfile) {
    redirect(`/criadores/${realUser.username}`);
  }
  const creator = realUser ?? (await userRepository.findMockCurrentCreator());

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row">
      <DashboardNav creatorUsername={creator.username} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
