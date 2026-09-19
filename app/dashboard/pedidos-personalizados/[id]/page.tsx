import { ConversationView } from "@/components/ConversationView";
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

  // Tela cheia como uma página própria (cobre até a sidebar do dashboard,
  // que continua montada por trás) — botão de voltar vive no cabeçalho do
  // próprio ConversationView.
  return (
    <div className="fixed inset-0 z-30 flex justify-center bg-(--color-bg)">
      <div className="flex h-full w-full max-w-2xl flex-col px-4 py-4">
        <ConversationView
          customRequestId={id}
          actingUserId={realUser?.id ?? null}
          backHref="/dashboard/pedidos-personalizados"
        />
      </div>
    </div>
  );
}
