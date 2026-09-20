import Link from "next/link";
import type { Product } from "@/lib/types";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { RatingStars } from "./RatingStars";
import { PriceTag } from "./PriceTag";
import { ArrowUpRight, Play } from "lucide-react";

export function ProductCard({ product, creatorName }: { product: Product; creatorName?: string }) {
  return (
    <Link
      href={`/produto/${product.id}`}
      className="group flex min-w-0 w-full flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-(--color-accent) hover:shadow-lg hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
    >
      <div className="relative">
        <MediaPlaceholder
          seed={product.id}
          kind={product.type === "video" ? "video" : "image"}
          className="aspect-[5/4] w-full transition-transform duration-300 group-hover:scale-[1.02]"
          label={product.title}
          flush
        />
        {product.type === "video" ? (
          <span className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-(--color-surface) text-(--color-accent) shadow-sm" aria-label="Conteúdo em vídeo">
            <Play size={14} fill="currentColor" />
          </span>
        ) : null}
        <span className="absolute bottom-2.5 right-2.5 max-w-[calc(100%-1.25rem)] rounded-(--radius-pill) border border-(--color-border) bg-(--color-surface) px-2.5 py-1 shadow-sm">
          <PriceTag price={product.price} promoPrice={product.promoPrice} size="sm" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">
        {creatorName ? (
          <div className="flex items-center gap-1.5">
            <MediaPlaceholder
              seed={product.creatorId}
              kind="avatar"
              className="h-5 w-5"
              label={creatorName}
            />
            <span className="truncate text-[11px] font-medium text-(--color-text-muted)">{creatorName}</span>
          </div>
        ) : null}
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-(--color-text)">{product.title}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-(--color-border) pt-2.5">
          <RatingStars rating={product.rating} ratingCount={product.ratingCount} size={12} />
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent) transition-colors group-hover:bg-(--color-accent) group-hover:text-white">
            <ArrowUpRight size={14} strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}
