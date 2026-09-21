"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import type { Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { listOwnedProductsForUser } from "@/lib/supabase/products";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";

/**
 * Conteúdo comprado de verdade: `product_entitlements` só é gravada pelo
 * servidor (webhook do Mercado Pago), nunca por este componente — ver
 * lib/payments/activateProductOrderAfterPayment.ts. Diferente da versão
 * anterior (localStorage/mock), o que aparece aqui sobrevive a reload, a
 * uma nova sessão e a trocar de dispositivo.
 */
export default function BibliotecaPage() {
  const { userId, loading } = useCurrentUserId();
  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    listOwnedProductsForUser(createClient(), userId).then(setFetchedProducts);
  }, [userId]);

  const products = loading ? null : userId ? fetchedProducts : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-center">
        <h1 className="text-base font-bold text-(--color-text)">Sua biblioteca</h1>
      </div>

      {products === null ? null : products.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Nenhum conteúdo por enquanto"
          description="O que você comprar aparece aqui assim que o pagamento for confirmado."
          action={
            <Link
              href="/descobrir"
              className="rounded-(--radius-pill) bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
            >
              Explorar conteúdos
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <div key={p.id} className="flex flex-col gap-1.5">
              <ProductCard product={p} />
              {p.fileUrl ? (
                <a
                  href={p.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start rounded-(--radius-pill) bg-(--color-accent-soft) px-3 py-1 text-xs font-medium text-(--color-accent) hover:bg-(--color-accent) hover:text-(--color-on-accent)"
                >
                  Baixar
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
