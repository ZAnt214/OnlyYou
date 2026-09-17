import Link from "next/link";
import { Pencil, Images, Star, Users } from "lucide-react";
import type { Product, User } from "@/lib/types";
import { PRODUCT_TYPE_LABELS } from "@/lib/types";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { RatingStars } from "@/components/RatingStars";
import { ProductCard } from "@/components/ProductCard";
import { ReportMenu } from "@/components/ReportMenu";
import { ProfileOwnerMenu } from "@/components/ProfileOwnerMenu";
import { CustomOrderForm } from "@/components/CustomOrderForm";

interface CreatorProfileViewProps {
  creator: User;
  products: Product[];
  /**
   * O perfil é a mesma tela para quem visita e para o próprio criador —
   * como em redes sociais como o TikTok. `isOwnProfile` só troca as ações
   * que não fazem sentido contra si mesmo (seguir, denunciar, pedir
   * conteúdo personalizado) por equivalentes de dono (editar perfil).
   */
  isOwnProfile?: boolean;
}

export function CreatorProfileView({ creator, products, isOwnProfile = false }: CreatorProfileViewProps) {
  const profile = creator.creatorProfile;
  if (!profile) return null;

  const approved = products.filter((p) => p.status === "approved");
  const typesOffered = [...new Set(approved.map((p) => p.type))];

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
        <div className="relative">
          <MediaPlaceholder
            seed={`${creator.id}-capa`}
            className="aspect-[3/1] w-full"
            label={`Capa de ${creator.displayName}`}
            flush
          />
          <div className="absolute right-3 top-3 flex items-center gap-3 rounded-(--radius-pill) bg-(--color-surface) px-3 py-1.5 text-xs text-(--color-text-muted)">
            <span className="flex items-center gap-1">
              <Images size={14} strokeWidth={1.5} />
              {profile.productCount}
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} strokeWidth={1.5} />
              {profile.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} strokeWidth={1.5} />
              {profile.followers.toLocaleString("pt-BR")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="relative -mt-10 flex items-end justify-between gap-3">
            <MediaPlaceholder
              seed={creator.id}
              kind="avatar"
              className="h-20 w-20 border-4 border-(--color-surface)"
              label={creator.displayName}
              flush
            />
            {isOwnProfile ? <ProfileOwnerMenu /> : <ReportMenu bare />}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-(--color-text)">{creator.displayName}</h1>
              {profile.verificationStatus === "verified" ? <VerifiedBadge size={18} /> : null}
            </div>
            <span className="text-sm text-(--color-text-subtle)">@{creator.username}</span>
          </div>

          <p className="text-sm text-(--color-text-muted)">{profile.bio}</p>

          {typesOffered.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {typesOffered.map((type) => (
                <span
                  key={type}
                  className="rounded-(--radius-pill) bg-(--color-surface-2) px-3 py-1 text-xs text-(--color-text-muted)"
                >
                  {PRODUCT_TYPE_LABELS[type]}
                </span>
              ))}
            </div>
          ) : null}

          <RatingStars rating={profile.rating} ratingCount={profile.ratingCount} />

          {isOwnProfile ? (
            <Link
              href="/dashboard/configuracoes"
              className="flex items-center justify-center gap-1.5 rounded-(--radius-pill) border border-(--color-border) px-4 py-2.5 text-sm font-medium text-(--color-text) hover:bg-(--color-surface-2)"
            >
              <Pencil size={14} strokeWidth={1.5} />
              Editar perfil
            </Link>
          ) : (
            <button
              type="button"
              className="rounded-(--radius-pill) bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
            >
              Seguir
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 border-t border-(--color-border) text-sm">
          <span className="flex items-center justify-center gap-2 border-b-2 border-(--color-accent) py-3 font-semibold text-(--color-accent)">
            <Images size={16} strokeWidth={1.5} />
            {profile.productCount} Produtos
          </span>
          <span className="flex items-center justify-center gap-2 border-b-2 border-transparent py-3 text-(--color-text-muted)">
            <Users size={16} strokeWidth={1.5} />
            {profile.followers.toLocaleString("pt-BR")} Seguidores
          </span>
        </div>
      </div>

      {profile.offerings?.length || profile.offeringsDescription ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-(--color-text)">O que ofereço</h2>
          {profile.offeringsDescription ? (
            <p className="max-w-2xl text-sm text-(--color-text-muted)">{profile.offeringsDescription}</p>
          ) : null}
          {profile.offerings?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.offerings.map((offering) => (
                <span
                  key={offering}
                  className="rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text-muted)"
                >
                  {offering}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

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

      <div className="flex flex-col gap-2 border-t border-(--color-border) pt-6">
        <h2 className="text-base font-semibold text-(--color-text)">Conteúdo personalizado</h2>
        <p className="max-w-2xl text-sm text-(--color-text-muted)">
          Peça um conteúdo feito sob encomenda para {creator.displayName}. O criador decide se
          aceita, e vocês combinam os detalhes antes da entrega.
        </p>
        {isOwnProfile ? (
          <p className="text-sm text-(--color-text-subtle)">
            Assim aparece para os compradores no seu perfil.
          </p>
        ) : (
          <CustomOrderForm creator={creator} />
        )}
      </div>
    </div>
  );
}
