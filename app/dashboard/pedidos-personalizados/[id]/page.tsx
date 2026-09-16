import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { userRepository } from "@/lib/repositories/UserRepository";
import { ConversationView } from "@/components/ConversationView";

export default async function DashboardCustomRequestConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await userRepository.findMockCurrentCreator();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Link
        href="/dashboard/pedidos-personalizados"
        className="flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text)"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Voltar
      </Link>
      <ConversationView customRequestId={id} actingUserId={creator.id} />
    </div>
  );
}
