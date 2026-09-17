"use client";

import { Heart } from "lucide-react";
import { useFavoriteRepository } from "@/lib/repositories/FavoriteRepository";

export function FavoriteButton({ productId, bare = false }: { productId: string; bare?: boolean }) {
  const favoriteRepo = useFavoriteRepository();
  const active = favoriteRepo.isFavorite(productId);

  return (
    <button
      type="button"
      onClick={() => favoriteRepo.toggle(productId)}
      aria-pressed={active}
      className={
        bare
          ? `flex items-center justify-center transition-colors ${
              active ? "text-(--color-accent)" : "text-(--color-text-muted) hover:text-(--color-accent)"
            }`
          : `flex h-8 w-8 items-center justify-center rounded-md border ${
              active
                ? "border-(--color-accent) text-(--color-accent)"
                : "border-(--color-border) text-(--color-text-muted) hover:bg-(--color-surface)"
            }`
      }
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart size={bare ? 22 : 16} strokeWidth={1.5} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
