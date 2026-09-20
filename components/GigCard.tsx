import { GIG_CATEGORY_LABELS, type Gig } from "@/lib/types";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { PriceTag } from "@/components/PriceTag";
import { RequestGigButton } from "@/components/RequestGigButton";

/**
 * Card compacto de gig pra grade (busca/descobrir) — mesma proporção do
 * ProductCard, mas com "Solicitar" no lugar de um link de compra direta,
 * já que um gig sempre passa pelo pedido personalizado.
 */
export function GigCard({ gig, creatorName }: { gig: Gig; creatorName?: string }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/10">
      <div className="relative">
        {gig.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gig.coverImageUrl} alt={gig.title} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <MediaPlaceholder seed={gig.id} className="aspect-[4/3] w-full" label={gig.title} flush />
        )}
        <span className="absolute right-2 top-2 rounded-(--radius-pill) bg-(--color-surface) px-2.5 py-1 shadow-sm">
          <PriceTag price={gig.priceCents / 100} size="sm" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {gig.category !== "general" ? (
          <span className="w-fit text-[10px] font-semibold uppercase tracking-wide text-(--color-accent)">
            {GIG_CATEGORY_LABELS[gig.category]}
          </span>
        ) : null}
        {creatorName ? (
          <div className="flex items-center gap-1.5">
            <MediaPlaceholder seed={gig.creatorId} kind="avatar" className="h-5 w-5" label={creatorName} />
            <span className="truncate text-xs text-(--color-text-subtle)">{creatorName}</span>
          </div>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold text-(--color-text)">{gig.title}</h3>
        {gig.game ? (
          <p className="truncate text-xs text-(--color-text-muted)">
            {gig.game}
            {gig.category === "play_together" && gig.sessionMinutes ? ` · ${gig.sessionMinutes} min` : ""}
            {gig.category === "elojob" && gig.currentRank && gig.targetRank ? ` · ${gig.currentRank} → ${gig.targetRank}` : ""}
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
            className="flex w-full items-center justify-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-3 py-1.5 text-xs font-semibold text-white hover:bg-(--color-accent-hover)"
          />
        </div>
      </div>
    </div>
  );
}
