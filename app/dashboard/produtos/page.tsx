"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { listProductsForCreator, updateProduct, deleteProduct } from "@/lib/supabase/products";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { StatusBadge } from "@/components/StatusBadge";
import { PriceTag } from "@/components/PriceTag";
import { Plus, Trash2 } from "lucide-react";

export default function DashboardProdutosPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const creator = await getCurrentCreatorClient();
      setProducts(await listProductsForCreator(createClient(), creator.id));
    })();
  }, []);

  async function handleTogglePause(product: Product) {
    setBusy(true);
    setError(null);
    try {
      const nextStatus = product.status === "approved" ? "draft" : "approved";
      const updated = await updateProduct(createClient(), product.id, {
        title: product.title,
        description: product.description,
        category: product.category,
        tags: product.tags,
        type: product.type,
        priceCents: Math.round(product.price * 100),
        promoPriceCents: product.promoPrice ? Math.round(product.promoPrice * 100) : null,
        coverImageUrl: product.coverImage,
        previewImages: product.previewImages,
        fileUrl: product.fileUrl,
        status: nextStatus,
      });
      setProducts((prev) => (prev ?? []).map((p) => (p.id === product.id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o produto.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteProduct(createClient(), id);
      setProducts((prev) => (prev ?? []).filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o produto.");
    } finally {
      setBusy(false);
    }
  }

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

      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

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
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleTogglePause(p)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text) disabled:opacity-60"
                      >
                        {p.status === "approved" ? "Despublicar" : "Publicar"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(p.id)}
                        aria-label="Excluir"
                        className="p-1.5 text-(--color-text-subtle) hover:text-(--color-danger)"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
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
