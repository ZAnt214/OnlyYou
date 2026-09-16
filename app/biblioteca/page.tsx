"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import { useEntitlementRepository } from "@/lib/repositories/EntitlementRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { ProductCard } from "@/components/ProductCard";

export default function BibliotecaPage() {
  const session = useMockSession();
  const entitlementRepo = useEntitlementRepository();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    productRepository.findAll().then(setProducts);
  }, []);

  const activeEntitlements = entitlementRepo
    .findByUser(session.currentUserId)
    .filter((e) => e.status === "active");

  const owned = (products ?? []).filter((p) =>
    activeEntitlements.some((e) => e.productId === p.id),
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Sua biblioteca</h1>
        <p className="text-sm text-(--color-text-muted)">
          Conteúdos com pagamento confirmado ficam disponíveis aqui.
        </p>
      </div>

      {products === null ? null : owned.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">Nenhum produto publicado ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {owned.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
