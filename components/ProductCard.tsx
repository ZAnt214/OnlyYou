import Link from "next/link";
import type { Product } from "@/lib/types";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { RatingStars } from "./RatingStars";
import { PriceTag } from "./PriceTag";

export function ProductCard({ product, creatorName }: { product: Product; creatorName?: string }) {
  return (
    <Link
      href={`/produto/${product.id}`}
      className="group flex w-full flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm transition-all hover:border-(--color-accent) hover:shadow-lg hover:shadow-black/10"
    >
      <div className="relative">
        <MediaPlaceholder
          seed={product.id}
          kind={product.type === "video" ? "video" : "image"}
          className="aspect-[4/3] w-full"
          label={product.title}
          flush
        />
        <span className="absolute right-2 top-2 rounded-(--radius-pill) bg-(--color-surface) px-2.5 py-1 shadow-sm">
          <PriceTag price={product.price} promoPrice={product.promoPrice} size="sm" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {creatorName ? (
          <div className="flex items-center gap-1.5">
            <MediaPlaceholder
              seed={product.creatorId}
              kind="avatar"
              className="h-5 w-5"
              label={creatorName}
            />
            <span className="truncate text-xs text-(--color-text-subtle)">{creatorName}</span>
          </div>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold text-(--color-text)">{product.title}</h3>
        <div className="mt-auto pt-0.5">
          <RatingStars rating={product.rating} ratingCount={product.ratingCount} size={12} />
        </div>
      </div>
    </Link>
  );
}
