import Link from "next/link";
import { MessageCircle, Bookmark } from "lucide-react";
import type { Product, User } from "@/lib/types";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PriceTag } from "@/components/PriceTag";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductReportMenu } from "@/components/ProductReportMenu";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `Há ${Math.max(minutes, 1)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `Há ${days}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

/**
 * Card de post do feed, no formato do site de referência: cabeçalho com
 * criador, legenda, mídia em destaque e barra de ações. Diferente do
 * ProductCard (grade compacta de catálogo), este é o formato de coluna
 * única usado na home.
 */
export function FeedPostCard({ product, creator }: { product: Product; creator?: User }) {
  const verified = creator?.creatorProfile?.verificationStatus === "verified";

  return (
    <article className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
      <div className="flex items-center gap-3 px-4 pt-4">
        {creator ? (
          <Link href={`/criadores/${creator.username}`} className="shrink-0">
            <MediaPlaceholder
              seed={creator.id}
              kind="avatar"
              className="h-10 w-10"
              label={creator.displayName}
            />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold text-(--color-text)">
              {creator?.displayName ?? "Criador"}
            </span>
            {verified ? <VerifiedBadge /> : null}
          </div>
          {creator ? (
            <span className="text-xs text-(--color-text-subtle)">@{creator.username}</span>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-(--color-text-subtle)">
          {relativeTime(product.createdAt)}
        </span>
        <ProductReportMenu productId={product.id} bare />
      </div>

      <Link href={`/produto/${product.id}`} className="block px-4 pb-3 pt-2">
        <h3 className="text-sm font-semibold text-(--color-text)">{product.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-(--color-text-muted)">{product.description}</p>
      </Link>

      <Link href={`/produto/${product.id}`} className="block">
        <MediaPlaceholder
          seed={product.id}
          kind={product.type === "video" ? "video" : "image"}
          className="aspect-[4/3] w-full"
          label={product.title}
          flush
        />
      </Link>

      <div className="flex items-center gap-5 px-4 pt-3">
        <FavoriteButton productId={product.id} bare />
        <Link
          href={`/produto/${product.id}#avaliacoes`}
          className="text-(--color-text-muted) transition-colors hover:text-(--color-accent-text)"
          aria-label="Ver avaliações"
        >
          <MessageCircle size={22} strokeWidth={1.5} />
        </Link>
        <Link
          href={`/checkout/${product.id}`}
          className="ml-auto text-(--color-text-muted) transition-colors hover:text-(--color-accent-text)"
          aria-label="Comprar agora"
        >
          <Bookmark size={22} strokeWidth={1.5} />
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-2">
        <span className="text-xs text-(--color-text-muted)">
          {product.ratingCount > 0
            ? `${product.rating.toFixed(1)} · ${product.ratingCount} avaliações`
            : "Sem avaliações"}
          {product.salesCount > 0 ? ` · ${product.salesCount.toLocaleString("pt-BR")} vendas` : ""}
        </span>
        <PriceTag price={product.price} promoPrice={product.promoPrice} size="sm" />
      </div>
    </article>
  );
}
