"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { useFavoriteRepository } from "@/lib/repositories/FavoriteRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { ProductCard } from "@/components/ProductCard";

export default function FavoritosPage() {
  const favoriteRepo = useFavoriteRepository();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    productRepository.findAll().then(setProducts);
  }, []);

  const favorites = favoriteRepo.list();
  const favoriteProducts = (products ?? []).filter((p) => favorites.includes(p.id));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Favoritos</h1>
        <p className="text-sm text-(--color-text-muted)">
          Produtos que você marcou para ver depois.
        </p>
      </div>

      {products === null ? null : favoriteProducts.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">
          Nenhum produto favoritado ainda. Explore o{" "}
          <a href="/descobrir" className="text-(--color-accent) hover:underline">
            catálogo
          </a>{" "}
          e marque o que quiser comprar depois.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {favoriteProducts.map((p) => (
            <div key={p.id} className="flex flex-col gap-1">
              <ProductCard product={p} />
              <button
                type="button"
                onClick={() => favoriteRepo.toggle(p.id)}
                className="text-xs text-(--color-text-subtle) hover:text-(--color-danger)"
              >
                Remover dos favoritos
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
