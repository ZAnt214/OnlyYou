"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { StatusBadge } from "@/components/StatusBadge";
import { PriceTag } from "@/components/PriceTag";
import { Plus } from "lucide-react";

export default function DashboardProdutosPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    (async () => {
      const creator = await getCurrentCreatorClient();
      setProducts(await productRepository.findByCreator(creator.id));
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-(--color-text)">Produtos</h1>
        <Link
          href="/dashboard/produtos/novo"
          className="flex items-center gap-1.5 rounded-md bg-(--color-accent) px-3 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          <Plus size={14} strokeWidth={2} />
          Adicionar produto
        </Link>
      </div>

      {products === null ? null : products.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">Nenhum produto publicado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-(--color-border)">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-subtle)">
                <th className="px-4 py-2 font-medium">Produto</th>
                <th className="px-4 py-2 font-medium">Preço</th>
                <th className="px-4 py-2 font-medium">Vendas</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-(--color-border) last:border-0">
                  <td className="px-4 py-3 text-(--color-text)">{p.title}</td>
                  <td className="px-4 py-3">
                    <PriceTag price={p.price} promoPrice={p.promoPrice} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-(--color-text-muted)">{p.salesCount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="cursor-not-allowed text-(--color-text-subtle)" title="Em breve">
                      Editar produto
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
