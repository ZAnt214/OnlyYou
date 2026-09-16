import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { userRepository } from "@/lib/repositories/UserRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { CreatorProfileView } from "@/components/CreatorProfileView";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const creator = await userRepository.findByUsername(username);
  if (!creator || !creator.creatorProfile) notFound();

  const products = await productRepository.findByCreator(creator.id);

  const mockCurrentCreator = await userRepository.findMockCurrentCreator();
  const isOwnProfile = creator.id === mockCurrentCreator.id;

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

      <CreatorProfileView creator={creator} products={products} variant="public" />
    </div>
  );
}
