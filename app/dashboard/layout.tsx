import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/session";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Sessão real sem papel de criadora ainda -> nunca mostra o painel mock
  // de outra pessoa; manda para o próprio perfil, que exibe o convite para
  // se tornar criadora. Sem sessão real, cai no fallback de demo de sempre.
  const realUser = await getCurrentUser();
  if (realUser && !realUser.creatorProfile) {
    redirect(`/criadores/${realUser.username}`);
  }

  return <DashboardShell>{children}</DashboardShell>;
}
