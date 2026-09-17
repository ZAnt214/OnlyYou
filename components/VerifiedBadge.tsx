import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center text-(--color-verified)"
      title="Criador verificado"
    >
      <BadgeCheck size={size} strokeWidth={2} />
    </span>
  );
}
