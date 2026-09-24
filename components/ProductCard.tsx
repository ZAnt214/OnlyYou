import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { RatingStars } from "./RatingStars";
import { formatBRL } from "./PriceTag";
import { Play, ShoppingBag } from "lucide-react";

export function ProductCard({
  product,
  creatorName,
  marketplace = false,
}: {
  product: Product;
  creatorName?: string;
  marketplace?: boolean;
}) {
  const productHref = `/produto/${product.id}`;
  const checkoutHref = `/checkout/${product.id}`;

  return (
    <article
      className={`group flex min-w-0 w-full flex-shrink-0 flex-col overflow-hidden ${
        marketplace
          ? "bg-transparent"
          : "rounded-xl border border-(--color-border) bg-(--color-surface)"
      } transition-colors hover:border-(--color-accent-text)`}
    >
      <Link
        href={productHref}
        aria-label={`Ver detalhes de ${product.title}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text)"
      >
        <div
          className={`relative overflow-hidden bg-(--color-surface-2) ${
            marketplace
              ? "aspect-[16/10] rounded-xl"
              : "aspect-[4/3] border-b border-(--color-border)"
          }`}
        >
          {product.coverImage ? (
            <Image
              src={product.coverImage}
              alt={product.title}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <MediaPlaceholder
              seed={product.id}
              kind={product.type === "video" ? "video" : "image"}
              className="h-full w-full"
              label={product.title}
              flush
              muted
            />
          )}

          {product.type === "video" ? (
            <span
              className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-(--color-surface) text-(--color-accent-text) shadow-sm"
              aria-label="Conteúdo em vídeo"
            >
              <Play size={14} fill="currentColor" />
            </span>
          ) : null}

          {product.promoPrice != null && product.promoPrice < product.price ? (
            <span className="absolute right-2.5 top-2.5 rounded-(--radius-pill) bg-(--color-surface) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-(--color-text)">
              Oferta
            </span>
          ) : null}
        </div>
      </Link>

      <div className={`flex flex-1 flex-col ${marketplace ? "pt-4" : "p-3 sm:p-3.5"}`}>
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

        <Link
          href={productHref}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text)"
        >
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-(--color-text) group-hover:text-(--color-accent-text)">
            {product.title}
          </h3>
        </Link>

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

        <Link
          href={checkoutHref}
          aria-label={`Comprar ${product.title}`}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-(--color-accent) px-3 py-2 text-sm font-semibold text-(--color-on-accent) transition-colors hover:bg-(--color-accent-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent-text)"
        >
          <ShoppingBag size={14} strokeWidth={1.8} />
          Comprar
        </Link>
      </div>
    </article>
  );
}
