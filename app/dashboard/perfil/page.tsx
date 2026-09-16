import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { userRepository } from "@/lib/repositories/UserRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { CreatorProfileView } from "@/components/CreatorProfileView";

export default async function DashboardPerfilPage() {
  const creator = await userRepository.findMockCurrentCreator();
  const products = await productRepository.findByCreator(creator.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-(--color-text)">Meu perfil</h1>
          <p className="text-sm text-(--color-text-muted)">
            É assim que seu perfil aparece para os compradores.
          </p>
        </div>
        <Link
          href={`/criadores/${creator.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-shrink-0 items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text) hover:bg-(--color-surface)"
        >
          <ExternalLink size={14} strokeWidth={1.5} />
          Abrir versão pública
        </Link>
      </div>

      <div className="rounded-lg border border-(--color-border) p-4 sm:p-6">
        <CreatorProfileView creator={creator} products={products} variant="preview" />
      </div>
    </div>
  );
}
