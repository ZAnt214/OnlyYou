import Link from "next/link";
import type { User } from "@/lib/types";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { VerifiedBadge } from "./VerifiedBadge";
import { RatingStars } from "./RatingStars";

export function CreatorCard({ creator, compactHome = false }: { creator: User; compactHome?: boolean }) {
  const profile = creator.creatorProfile;
  if (compactHome) {
    return (
      <Link
        href={`/criadores/${creator.username}`}
        className="flex min-w-0 items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 transition-colors hover:border-(--color-accent-text)"
      >
        <MediaPlaceholder seed={creator.id} kind="avatar" className="h-11 w-11 shrink-0" label={creator.displayName} />
        <span className="min-w-0">
          <span className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold text-(--color-text)">{creator.displayName}</span>
            {profile?.verificationStatus === "verified" ? <VerifiedBadge /> : null}
          </span>
          <span className="block truncate text-xs text-(--color-text-muted)">@{creator.username}</span>
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={`/criadores/${creator.username}`}
      className="flex w-full flex-shrink-0 flex-col items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-bg) p-4 text-center transition-colors hover:border-(--color-accent-text)"
    >
      <MediaPlaceholder seed={creator.id} kind="avatar" className="h-16 w-16" label={creator.displayName} />
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-(--color-text)">{creator.displayName}</span>
        {profile?.verificationStatus === "verified" ? <VerifiedBadge /> : null}
      </div>
      <span className="text-xs text-(--color-text-subtle)">@{creator.username}</span>
      {profile ? (
        <>
          <RatingStars rating={profile.rating} ratingCount={profile.ratingCount} size={12} />
          <span className="text-xs text-(--color-text-subtle)">
            {profile.followers.toLocaleString("pt-BR")} seguidores
          </span>
        </>
      ) : null}
    </Link>
  );
}
