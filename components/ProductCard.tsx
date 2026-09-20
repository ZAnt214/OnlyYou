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
      <MediaPlaceholder
        seed={product.id}
        kind={product.type === "video" ? "video" : "image"}
        className="aspect-square w-full"
        label={product.title}
        flush
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        {creatorName ? (
          <span className="text-xs text-(--color-text-subtle)">{creatorName}</span>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-medium text-(--color-text)">{product.title}</h3>
        <RatingStars rating={product.rating} ratingCount={product.ratingCount} size={12} />
        <div className="mt-auto pt-1">
          <PriceTag price={product.price} promoPrice={product.promoPrice} size="sm" />
        </div>
      </div>
    </Link>
  );
}
