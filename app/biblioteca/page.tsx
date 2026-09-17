"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import type { Product } from "@/lib/types";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import { useEntitlementRepository } from "@/lib/repositories/EntitlementRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";

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
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-center">
        <h1 className="text-base font-bold text-(--color-text)">Sua biblioteca</h1>
      </div>

      {products === null ? null : owned.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Nenhum conteúdo por enquanto"
          description="O que você comprar aparece aqui assim que o pagamento for confirmado."
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
          {owned.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
