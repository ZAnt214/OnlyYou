import { notFound } from "next/navigation";
import { userRepository } from "@/lib/repositories/UserRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { CreatorProfileView } from "@/components/CreatorProfileView";
import { BecomeCreatorPrompt } from "@/components/BecomeCreatorPrompt";
import { getCurrentUser, getProfileByUsername } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { listCustomOrderReviewsForUser } from "@/lib/supabase/customRequests";
import { listPortfolioForCreator } from "@/lib/supabase/portfolio";

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
  // Avaliações e portfólio reais só existem pra perfis reais — um
  // creator.id mock não bate com nenhuma linha, então as listas vêm vazias
  // sem precisar de um caminho separado pro fallback de demo.
  const supabase = await createServerClient();
  const [reviews, portfolio] = await Promise.all([
    listCustomOrderReviewsForUser(supabase, creator.id),
    listPortfolioForCreator(supabase, creator.id),
  ]);

  // O acesso ao painel saiu de uma faixa fixa no topo da página e virou um
  // botão de destaque junto de "Editar perfil" (ver CreatorProfileView) —
  // bem visível pro dono, sem competir com o resto do perfil.
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <CreatorProfileView
        creator={creator}
        products={products}
        reviews={reviews}
        portfolio={portfolio}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
