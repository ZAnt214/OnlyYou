import type { Product, User } from "@/lib/types";
import { PRODUCT_TYPE_LABELS } from "@/lib/types";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { RatingStars } from "@/components/RatingStars";
import { ProductCard } from "@/components/ProductCard";
import { ReportMenu } from "@/components/ReportMenu";
import { CustomOrderForm } from "@/components/CustomOrderForm";

interface CreatorProfileViewProps {
  creator: User;
  products: Product[];
  /**
   * "public": como um comprador vê a loja do criador (/criadores/[username]).
   * "preview": renderizado dentro do painel do criador (/dashboard/perfil) —
   * mesmo conteúdo, sem ações que só fazem sentido para quem está de fora
   * (seguir, denunciar, pedir conteúdo personalizado).
   */
  variant?: "public" | "preview";
}

export function CreatorProfileView({ creator, products, variant = "public" }: CreatorProfileViewProps) {
  const profile = creator.creatorProfile;
  if (!profile) return null;

  const approved = products.filter((p) => p.status === "approved");
  const typesOffered = [...new Set(approved.map((p) => p.type))];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <MediaPlaceholder seed={creator.id} kind="avatar" className="h-20 w-20" label={creator.displayName} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-semibold text-(--color-text)">{creator.displayName}</h1>
              {profile.verificationStatus === "verified" ? <VerifiedBadge /> : null}
            </div>
            <span className="text-sm text-(--color-text-subtle)">@{creator.username}</span>
            <RatingStars rating={profile.rating} ratingCount={profile.ratingCount} />
          </div>
        </div>
        {variant === "public" ? <ReportMenu /> : null}
      </div>

      <p className="max-w-2xl text-sm text-(--color-text-muted)">{profile.bio}</p>

      <div className="flex items-center gap-6 border-y border-(--color-border) py-3 text-sm text-(--color-text-muted)">
        <span>
          <strong className="text-(--color-text)">{profile.followers.toLocaleString("pt-BR")}</strong>{" "}
          seguidores
        </span>
        <span>
          <strong className="text-(--color-text)">{profile.productCount}</strong> produtos
        </span>
        {variant === "public" ? (
          <button
            type="button"
            className="ml-auto rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
          >
            Seguir
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-(--color-text)">
          O que {creator.displayName} vende
        </h2>
        {typesOffered.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Nenhum produto publicado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {typesOffered.map((type) => (
              <span
                key={type}
                className="rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text-muted)"
              >
                {PRODUCT_TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-(--color-text)">Produtos</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Nenhum produto publicado ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {approved.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {variant === "public" ? (
        <div className="flex flex-col gap-2 border-t border-(--color-border) pt-6">
          <h2 className="text-base font-semibold text-(--color-text)">Conteúdo personalizado</h2>
          <p className="max-w-2xl text-sm text-(--color-text-muted)">
            Peça um conteúdo feito sob encomenda para {creator.displayName}. O criador decide se
            aceita, e vocês combinam os detalhes antes da entrega.
          </p>
          <CustomOrderForm creatorId={creator.id} />
        </div>
      ) : null}
    </div>
  );
}
