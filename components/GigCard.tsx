import type { Gig } from "@/lib/types";
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
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
      {gig.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={gig.coverImageUrl} alt={gig.title} className="aspect-square w-full object-cover" />
      ) : (
        <MediaPlaceholder seed={gig.id} className="aspect-square w-full" label={gig.title} flush />
      )}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {creatorName ? <span className="text-xs text-(--color-text-subtle)">{creatorName}</span> : null}
        <h3 className="line-clamp-2 text-sm font-medium text-(--color-text)">{gig.title}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <PriceTag price={gig.priceCents / 100} size="sm" />
          <RequestGigButton
            gig={gig}
            className="rounded-(--radius-pill) bg-(--color-accent) px-3 py-1.5 text-xs font-semibold text-white hover:bg-(--color-accent-hover)"
          />
        </div>
      </div>
    </div>
  );
}
