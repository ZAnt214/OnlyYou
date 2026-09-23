import { GIG_CATEGORY_LABELS, type Gig } from "@/lib/types";
import Image from "next/image";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { PriceTag } from "@/components/PriceTag";
import { RequestGigButton } from "@/components/RequestGigButton";

/**
 * Card compacto de gig pra grade (busca/descobrir) — mesma proporção do
 * ProductCard, mas com "Solicitar" no lugar de um link de compra direta,
 * já que um gig sempre passa pelo pedido personalizado.
 */
export function GigCard({
  gig,
  creatorName,
  compactOnMobile = false,
  marketplace = false,
}: {
  gig: Gig;
  creatorName?: string;
  compactOnMobile?: boolean;
  marketplace?: boolean;
}) {
  return (
    <article
      className={`w-full overflow-hidden ${marketplace ? "rounded-xl" : "rounded-2xl"} border border-(--color-border) bg-(--color-surface) transition-colors hover:border-(--color-text-muted) ${
        compactOnMobile
          ? "grid min-h-40 grid-cols-[7.25rem_minmax(0,1fr)] sm:flex sm:min-h-0 sm:flex-col"
          : "flex flex-col"
      }`}
    >
      <div className={`relative ${compactOnMobile ? "min-h-40 sm:aspect-[4/3] sm:min-h-0" : "aspect-[4/3]"}`}>
        {gig.coverImageUrl ? (
          <Image
            src={gig.coverImageUrl}
            alt={gig.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <MediaPlaceholder
            seed={gig.id}
            className={
              compactOnMobile ? "h-full min-h-40 w-full sm:min-h-0" : "h-full w-full"
            }
            label={gig.title}
            flush
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        {!marketplace ? <div className="flex min-h-5 items-start justify-between gap-2">
          {gig.category !== "general" ? (
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-(--color-accent-text)">
              {GIG_CATEGORY_LABELS[gig.category]}
            </span>
          ) : (
            <span className="text-[10px] font-medium uppercase tracking-wide text-(--color-text-subtle)">
              Serviço
            </span>
          )}
          <span className="shrink-0">
            <PriceTag price={gig.priceCents / 100} size="sm" />
          </span>
        </div>
        : null}
        {creatorName ? (
          <div className="flex items-center gap-1.5">
            <MediaPlaceholder
              seed={gig.creatorId}
              kind="avatar"
              className="h-5 w-5"
              label={creatorName}
            />
            <span className="truncate text-xs text-(--color-text-subtle)">
              {creatorName}
            </span>
          </div>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold text-(--color-text)">
          {gig.title}
        </h3>
        {marketplace ? <div className="mt-auto pt-2"><p className="text-xs text-(--color-text-muted)">A partir de</p><PriceTag price={gig.priceCents / 100} size="md" /></div> : null}
        {gig.game ? (
          <p className="truncate text-xs text-(--color-text-muted)">
            {gig.game}
            {gig.category === "play_together" && gig.sessionMinutes
              ? ` · ${gig.sessionMinutes} min`
              : ""}
            {gig.category === "elojob" && gig.currentRank && gig.targetRank
              ? ` · ${gig.currentRank} → ${gig.targetRank}`
              : ""}
          </p>
        ) : null}
        {gig.revisionCount !== undefined ? (
          <span className="w-fit text-[10px] text-(--color-text-subtle)">
            {gig.revisionCount === 0
              ? "Sem revisões"
              : `${gig.revisionCount} ${gig.revisionCount === 1 ? "revisão" : "revisões"}`}
          </span>
        ) : null}
        <div className="mt-auto pt-1">
          <RequestGigButton
            gig={gig}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-(--radius-pill) border border-(--color-border) px-3 py-2 text-sm font-semibold text-(--color-text) hover:border-(--color-accent-text)"
          />
        </div>
      </div>
    </article>
  );
}
