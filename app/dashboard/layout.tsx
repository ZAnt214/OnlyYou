import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/session";
import { DashboardBackLink } from "@/components/DashboardBackLink";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Sessão real sem papel de criadora ainda -> nunca mostra o painel mock
  // de outra pessoa; manda para o próprio perfil, que exibe o convite para
  // se tornar criadora. Sem sessão real, cai no fallback de demo de sempre.
  const realUser = await getCurrentUser();
  if (realUser && !realUser.creatorProfile) {
    redirect(`/criadores/${realUser.username}`);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
      <DashboardBackLink />
      {children}
    </div>
  );
}
