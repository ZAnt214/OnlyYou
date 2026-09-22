import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/session";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Dashboard é uma área privada. Nunca renderiza identidade ou dados mock
  // para visitantes sem uma sessão Supabase verificada.
  const realUser = await getCurrentUser();
  if (!realUser) {
    redirect("/entrar");
  }
  if (!realUser.creatorProfile) {
    redirect(`/criadores/${realUser.username}`);
  }

  return <DashboardShell>{children}</DashboardShell>;
}
