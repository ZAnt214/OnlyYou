"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { listProductsForCreator, updateProduct, deleteProduct } from "@/lib/supabase/products";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { DashboardLoading } from "@/components/DashboardLoading";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { PriceTag } from "@/components/PriceTag";
import { StatusBadge } from "@/components/StatusBadge";

type ProductFilter = "all" | "published" | "draft" | "blocked";

export default function DashboardProdutosPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const creator = await getCurrentCreatorClient();
        const rows = await listProductsForCreator(createClient(), creator.id);
        if (active) setProducts(rows);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Não foi possível carregar seus produtos.");
          setProducts([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleTogglePause(product: Product) {
    setBusyId(product.id);
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
      setProducts((prev) => (prev ?? []).map((item) => (item.id === product.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o produto.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(product: Product) {
    setBusyId(product.id);
    setError(null);
    try {
      await deleteProduct(createClient(), product.id);
      setProducts((prev) => (prev ?? []).filter((item) => item.id !== product.id));
      setDeleteCandidate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o produto.");
      setDeleteCandidate(null);
    } finally {
      setBusyId(null);
    }
  }

  if (products === null) return <DashboardLoading />;

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const counts = {
    all: products.length,
    published: products.filter((product) => product.status === "approved").length,
    draft: products.filter((product) => product.status === "draft").length,
    blocked: products.filter((product) => !["approved", "draft"].includes(product.status)).length,
  };

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.title.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        product.category.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        product.tags.some((tag) => tag.toLocaleLowerCase("pt-BR").includes(normalizedQuery));

      const matchesFilter =
        filter === "all" ||
        (filter === "published" && product.status === "approved") ||
        (filter === "draft" && product.status === "draft") ||
        (filter === "blocked" && !["approved", "draft"].includes(product.status));

      return matchesQuery && matchesFilter;
    });
  }, [filter, normalizedQuery, products]);

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Catálogo"
        title="Produtos"
        description="Arquivos digitais que a pessoa compra e recebe pela biblioteca."
        action={
          <Link
            href="/dashboard/produtos/novo"
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
          >
            <Plus size={15} strokeWidth={1.8} />
            Novo produto
          </Link>
        }
      />

      {error ? (
        <div className="rounded-xl border border-(--color-danger) bg-(--color-surface) px-4 py-3 text-sm text-(--color-danger)">
          {error}
        </div>
      ) : null}

      {products.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              size={15}
              strokeWidth={1.6}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-subtle)"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar produto"
              className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) py-2.5 pl-9 pr-3 text-base text-(--color-text) placeholder:text-(--color-text-subtle) focus:border-(--color-accent-text) focus:outline-none sm:text-sm"
            />
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <ProductFilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              Todos {counts.all}
            </ProductFilterButton>
            <ProductFilterButton active={filter === "published"} onClick={() => setFilter("published")}>
              Publicados {counts.published}
            </ProductFilterButton>
            <ProductFilterButton active={filter === "draft"} onClick={() => setFilter("draft")}>
              Rascunhos {counts.draft}
            </ProductFilterButton>
            {counts.blocked > 0 ? (
              <ProductFilterButton active={filter === "blocked"} onClick={() => setFilter("blocked")}>
                Com restrição {counts.blocked}
              </ProductFilterButton>
            ) : null}
          </div>
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
          <p className="font-semibold text-(--color-text)">Você ainda não publicou nenhum produto</p>
          <p className="max-w-lg text-sm leading-relaxed text-(--color-text-muted)">
            Publique um arquivo digital com capa, descrição e preço. Quem comprar recebe o acesso pela própria biblioteca.
          </p>
          <Link href="/dashboard/produtos/novo" className="text-sm font-medium text-(--color-accent-text) hover:underline">
            Criar primeiro produto
          </Link>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-8 text-center">
          <p className="text-sm font-medium text-(--color-text)">Nada encontrado</p>
          <p className="mt-1 text-xs text-(--color-text-muted)">Tente outro nome ou mude o filtro.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 shadow-sm sm:flex-row sm:items-center"
            >
              {product.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.coverImage}
                  alt=""
                  className="h-28 w-full rounded-xl object-cover sm:h-16 sm:w-20 sm:shrink-0"
                />
              ) : (
                <MediaPlaceholder
                  seed={product.id}
                  label={product.title}
                  className="h-28 w-full rounded-xl sm:h-16 sm:w-20 sm:shrink-0"
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-(--color-text)">{product.title}</p>
                    <div className="mt-1">
                      <PriceTag price={product.price} promoPrice={product.promoPrice} size="sm" />
                    </div>
                  </div>
                  <StatusBadge status={product.status} />
                </div>
                <p className="mt-2 text-xs text-(--color-text-subtle)">
                  {product.salesCount} {product.salesCount === 1 ? "venda" : "vendas"}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-(--color-border) pt-3 sm:justify-end sm:border-0 sm:pt-0">
                {product.status === "approved" ? (
                  <button
                    type="button"
                    disabled={busyId === product.id}
                    onClick={() => void handleTogglePause(product)}
                    className="rounded-full border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text) disabled:opacity-60"
                  >
                    {busyId === product.id ? "Salvando…" : "Despublicar"}
                  </button>
                ) : product.status === "draft" ? (
                  <Link
                    href={`/dashboard/produtos/${product.id}/editar`}
                    className="rounded-full border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text)"
                  >
                    Continuar
                  </Link>
                ) : (
                  <span className="px-2 text-xs text-(--color-text-subtle)">Bloqueado</span>
                )}
                {product.status === "approved" || product.status === "draft" ? (
                  <Link
                    href={`/dashboard/produtos/${product.id}/editar`}
                    aria-label={`Editar ${product.title}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-text-subtle) hover:bg-(--color-surface-2) hover:text-(--color-text)"
                  >
                    <Pencil size={15} strokeWidth={1.6} />
                  </Link>
                ) : null}
                <button
                  type="button"
                  disabled={busyId === product.id}
                  onClick={() => setDeleteCandidate(product)}
                  aria-label={`Excluir ${product.title}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-text-subtle) hover:bg-(--color-surface-2) hover:text-(--color-danger) disabled:opacity-60"
                >
                  <Trash2 size={15} strokeWidth={1.6} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-(--color-contrast) opacity-50" onClick={() => setDeleteCandidate(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-(--color-text)">Excluir produto?</h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">
              “{deleteCandidate.title}” vai sair do seu painel. Se alguém já comprou esse produto, o Jobê bloqueia a exclusão e pede para despublicar no lugar.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-full border border-(--color-border) px-4 py-2 text-sm text-(--color-text)"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busyId === deleteCandidate.id}
                onClick={() => void handleDelete(deleteCandidate)}
                className="inline-flex items-center gap-1.5 rounded-full border border-(--color-danger) bg-(--color-surface) px-4 py-2 text-sm font-semibold text-(--color-danger) disabled:opacity-60"
              >
                {busyId === deleteCandidate.id ? <Loader2 size={14} className="animate-spin" /> : null}
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


function ProductFilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? "border-(--color-contrast) bg-(--color-contrast) text-(--color-on-contrast)"
          : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted)"
      }`}
    >
      {children}
    </button>
  );
}
