import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { userRepository } from "@/lib/repositories/UserRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { CreatorProfileView } from "@/components/CreatorProfileView";

export default async function MeuPerfilPage() {
  const creator = await userRepository.findMockCurrentCreator();
  const products = await productRepository.findByCreator(creator.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-3 rounded-md border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm text-(--color-text-muted)">
        <span>É assim que seu perfil aparece para os compradores.</span>
        <Link
          href="/dashboard"
          className="flex flex-shrink-0 items-center gap-1.5 font-medium text-(--color-text) hover:underline"
        >
          <LayoutDashboard size={14} strokeWidth={1.5} />
          Ir para o painel
        </Link>
      </div>

      <CreatorProfileView creator={creator} products={products} variant="preview" />
    </div>
  );
}
