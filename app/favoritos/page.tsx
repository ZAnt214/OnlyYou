"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useFavoriteRepository } from "@/lib/repositories/FavoriteRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";

export default function FavoritosPage() {
  const favoriteRepo = useFavoriteRepository();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    productRepository.findAll().then(setProducts);
  }, []);

  const favorites = favoriteRepo.list();
  const favoriteProducts = (products ?? []).filter((p) => favorites.includes(p.id));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-center">
        <h1 className="text-base font-bold text-(--color-text)">Favoritos</h1>
      </div>

      {products === null ? null : favoriteProducts.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nenhum favorito por enquanto"
          description="Toque no coração de um conteúdo para guardar e ver depois."
          action={
            <Link
              href="/descobrir"
              className="rounded-(--radius-pill) bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
            >
              Explorar conteúdos
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {favoriteProducts.map((p) => (
            <div key={p.id} className="flex flex-col gap-1.5">
              <ProductCard product={p} />
              <button
                type="button"
                onClick={() => favoriteRepo.toggle(p.id)}
                className="self-start rounded-(--radius-pill) px-3 py-1 text-xs text-(--color-text-subtle) hover:bg-(--color-surface-2) hover:text-(--color-danger)"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
