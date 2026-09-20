import { ConversationScreen } from "@/components/ConversationScreen";
import { getCurrentUser } from "@/lib/supabase/session";

export default async function DashboardCustomRequestConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Ver comentário em pedidos-personalizados/page.tsx — o fluxo agora
  // exige conta real, sem fallback mock.
  const realUser = await getCurrentUser();

  return (
    <ConversationScreen
      customRequestId={id}
      actingUserId={realUser?.id ?? null}
      backHref="/dashboard/pedidos-personalizados"
    />
  );
}
