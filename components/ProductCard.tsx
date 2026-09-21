import Link from "next/link";
import type { Product } from "@/lib/types";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { RatingStars } from "./RatingStars";
import { formatBRL } from "./PriceTag";
import { Play } from "lucide-react";

export function ProductCard({
  product,
  creatorName,
}: {
  product: Product;
  creatorName?: string;
}) {
  return (
    <Link
      href={`/produto/${product.id}`}
      className="group flex min-w-0 w-full flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm transition-colors hover:border-(--color-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
    >
      <div className="relative overflow-hidden border-b border-(--color-border)">
        <MediaPlaceholder
          seed={product.id}
          kind={product.type === "video" ? "video" : "image"}
          className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.02]"
          label={product.title}
          flush
          muted
        />
        {product.type === "video" ? (
          <span
            className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-(--color-surface) text-(--color-accent) shadow-sm"
            aria-label="Conteúdo em vídeo"
          >
            <Play size={14} fill="currentColor" />
          </span>
        ) : null}
        {product.promoPrice != null && product.promoPrice < product.price ? (
          <span className="absolute right-2.5 top-2.5 rounded-(--radius-pill) bg-(--color-highlight-soft) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-(--color-highlight)">
            Oferta
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        {creatorName ? (
          <div className="mb-2 flex items-center gap-1.5">
            <MediaPlaceholder
              seed={product.creatorId}
              kind="avatar"
              className="h-4 w-4"
              label={creatorName}
            />
            <span className="truncate text-[11px] text-(--color-text-muted)">
              {creatorName}
            </span>
          </div>
        ) : null}
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-(--color-text)">
          {product.title}
        </h3>

        <div className="mt-3 flex min-h-9 flex-col justify-end">
          {product.promoPrice != null && product.promoPrice < product.price ? (
            <>
              <span className="text-[11px] text-(--color-text-subtle) line-through">
                {formatBRL(product.price)}
              </span>
              <span className="text-base font-bold leading-tight text-(--color-highlight)">
                {formatBRL(product.promoPrice)}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-(--color-text)">
              {formatBRL(product.price)}
            </span>
          )}
        </div>

        <div className="mt-3 border-t border-(--color-border) pt-2.5">
          <RatingStars
            rating={product.rating}
            ratingCount={product.ratingCount}
            size={12}
          />
        </div>
      </div>
    </Link>
  );
}
