import Link from "next/link";
import type { User } from "@/lib/types";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { VerifiedBadge } from "./VerifiedBadge";
import { RatingStars } from "./RatingStars";

export function CreatorCard({ creator }: { creator: User }) {
  const profile = creator.creatorProfile;
  return (
    <Link
      href={`/criadores/${creator.username}`}
      className="flex w-full flex-shrink-0 flex-col items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-bg) p-4 text-center transition-colors hover:border-(--color-accent)"
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
