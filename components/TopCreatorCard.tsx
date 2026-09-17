import Link from "next/link";
import type { User } from "@/lib/types";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { VerifiedBadge } from "@/components/VerifiedBadge";

/**
 * Card do trilho "Top Creators": mídia em destaque com a posição do ranking
 * em numeral grande sobreposto, no formato do site de referência.
 */
export function TopCreatorCard({ creator, rank }: { creator: User; rank: number }) {
  const verified = creator.creatorProfile?.verificationStatus === "verified";

  return (
    <Link
      href={`/criadores/${creator.username}`}
      className="relative block w-44 shrink-0 overflow-hidden rounded-2xl sm:w-auto"
    >
      <MediaPlaceholder
        seed={creator.id}
        className="aspect-[3/4] w-full"
        label={creator.displayName}
        flush
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <span className="absolute bottom-11 left-3 text-5xl font-bold leading-none text-white">
        {rank}
      </span>
      <div className="absolute inset-x-3 bottom-3">
        <div className="flex items-center gap-1">
          <span className="truncate text-sm font-semibold text-white">{creator.displayName}</span>
          {verified ? <VerifiedBadge /> : null}
        </div>
        <span className="block truncate text-xs text-white/70">@{creator.username}</span>
      </div>
    </Link>
  );
}
