import Link from "next/link";
import { Clock } from "lucide-react";
import { GIG_CATEGORY_LABELS, type Gig, type User } from "@/lib/types";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PriceTag } from "@/components/PriceTag";
import { RequestGigButton } from "@/components/RequestGigButton";

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
 * Card de gig no feed, no mesmo formato de FeedPostCard (cabeçalho do
 * criador, legenda, mídia, ação) — mas sem link para uma página de
 * detalhe própria (o gig não tem uma, diferente de Produto): a ação é
 * "Solicitar", que já abre o pedido personalizado direto.
 */
export function GigFeedCard({ gig, creator }: { gig: Gig; creator?: User }) {
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
        <span className="shrink-0 text-xs text-(--color-text-subtle)">{relativeTime(gig.createdAt)}</span>
      </div>

      <div className="px-4 pb-3 pt-2">
        <span className="mb-1 inline-block w-fit rounded-md bg-(--color-accent-soft) px-2 py-0.5 text-xs font-medium text-(--color-accent)">
          {GIG_CATEGORY_LABELS[gig.category]}
        </span>
        <h3 className="text-sm font-semibold text-(--color-text)">{gig.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-(--color-text-muted)">{gig.description}</p>
        {gig.game ? (
          <p className="mt-2 text-xs font-medium text-(--color-text-muted)">
            {gig.game}
            {gig.platform ? ` · ${gig.platform}` : ""}
            {gig.category === "play_together" && gig.sessionMinutes ? ` · ${gig.sessionMinutes} minutos` : ""}
            {gig.category === "elojob" && gig.currentRank && gig.targetRank ? ` · ${gig.currentRank} → ${gig.targetRank}` : ""}
          </p>
        ) : null}
        {gig.includedItems.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-0.5">
            {gig.includedItems.slice(0, 3).map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-(--color-text-muted)">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-(--color-accent)" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {gig.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={gig.coverImageUrl} alt={gig.title} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <MediaPlaceholder seed={gig.id} className="aspect-[4/3] w-full" label={gig.title} flush />
      )}

      <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-(--color-text-subtle)">A partir de</span>
          <PriceTag price={gig.priceCents / 100} size="sm" />
        </div>
        {gig.deliveryDays ? (
          <span className="flex items-center gap-1 text-xs text-(--color-text-muted)">
            <Clock size={12} strokeWidth={1.5} />
            {gig.deliveryDays} {gig.deliveryDays === 1 ? "dia" : "dias"}
          </span>
        ) : null}
        {gig.revisionCount !== undefined ? (
          <span className="text-xs text-(--color-text-muted)">
            {gig.revisionCount === 0
              ? "Sem revisões"
              : `${gig.revisionCount} ${gig.revisionCount === 1 ? "revisão" : "revisões"}`}
          </span>
        ) : null}
        <RequestGigButton gig={gig} className="flex items-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-accent-hover)" />
      </div>
    </article>
  );
}
