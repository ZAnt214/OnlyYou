import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { userRepository } from "@/lib/repositories/UserRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { CreatorProfileView } from "@/components/CreatorProfileView";
import { BecomeCreatorPrompt } from "@/components/BecomeCreatorPrompt";
import { getCurrentUser, getProfileByUsername } from "@/lib/supabase/session";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Verifica primeiro se existe um perfil real com este username; se não
  // houver, cai para os criadores mock (comportamento de demo inalterado).
  const realProfile = await getProfileByUsername(username);
  const creator = realProfile ?? (await userRepository.findByUsername(username));
  if (!creator) notFound();

  const currentUser = await getCurrentUser();
  const isOwnProfile = currentUser
    ? currentUser.id === creator.id
    : creator.id === (await userRepository.findMockCurrentCreator()).id;

  // Pessoa real, logada, vendo o próprio perfil, mas ainda não é criadora
  // (roles sem "creator" -> mapProfileRowToUser não preencheu creatorProfile).
  // Mostra um convite para se tornar criadora em vez de página em branco.
  if (!creator.creatorProfile) {
    if (isOwnProfile) {
      return (
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
          <BecomeCreatorPrompt user={creator} />
        </div>
      );
    }
    // Perfil de outra pessoa que não é criadora (comprador, ou id mock sem
    // perfil de criador) — perfis públicos só existem para criadores.
    notFound();
  }

  const products = await productRepository.findByCreator(creator.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      {isOwnProfile ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm text-(--color-text-muted)">
          <span>Esta é a visualização pública do seu perfil — é o que os compradores veem.</span>
          <Link
            href="/dashboard"
            className="flex flex-shrink-0 items-center gap-1.5 font-medium text-(--color-text) hover:underline"
          >
            <LayoutDashboard size={14} strokeWidth={1.5} />
            Ir para o painel
          </Link>
        </div>
      ) : null}

      <CreatorProfileView creator={creator} products={products} isOwnProfile={isOwnProfile} />
    </div>
  );
}
