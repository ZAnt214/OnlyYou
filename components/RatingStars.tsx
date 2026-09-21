import { Star } from "lucide-react";

export function RatingStars({
  rating,
  ratingCount,
  size = 14,
}: {
  rating: number;
  ratingCount?: number;
  size?: number;
}) {
  if (!ratingCount) {
    return <span className="text-xs text-(--color-text-subtle)">Sem avaliações</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Star
        size={size}
        className="text-(--color-accent-text)"
        fill="currentColor"
        strokeWidth={0}
      />
      <span className="text-sm font-medium text-(--color-text)">{rating.toFixed(1)}</span>
      <span className="text-xs text-(--color-text-subtle)">({ratingCount})</span>
    </div>
  );
}
