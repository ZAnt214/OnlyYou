"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Library,
  PackageOpen,
  Video,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { PRODUCT_TYPE_LABELS } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { listOwnedProductsForUser } from "@/lib/supabase/products";
import { EmptyState } from "@/components/EmptyState";

type LibraryFilter = "all" | "images" | "packs" | "pdfs" | "videos";

const FILTERS: Array<{ id: LibraryFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "images", label: "Imagens" },
  { id: "packs", label: "Packs" },
  { id: "pdfs", label: "PDFs" },
  { id: "videos", label: "Vídeos" },
];

function getFileExtension(fileUrl: string): string {
  if (!fileUrl) return "";
  try {
    const pathname = new URL(fileUrl).pathname;
    const filename = pathname.split("/").pop() ?? "";
    return filename.includes(".")
      ? filename.split(".").pop()?.toLowerCase() ?? ""
      : "";
  } catch {
    return "";
  }
}

function getLibraryFilter(product: Product): Exclude<LibraryFilter, "all"> {
  const extension = getFileExtension(product.fileUrl);

  if (extension === "pdf" || product.type === "ebook") return "pdfs";
  if (["mp4", "mov", "webm"].includes(extension) || product.type === "video") return "videos";
  if (
    ["zip", "rar", "7z"].includes(extension) ||
    product.type === "digital_pack" ||
    product.type === "template"
  ) {
    return "packs";
  }
  return "images";
}

function getFileLabel(product: Product): string {
  const extension = getFileExtension(product.fileUrl);
  if (extension) return extension.toUpperCase();
  return PRODUCT_TYPE_LABELS[product.type];
}

function ProductTypeIcon({ product }: { product: Product }) {
  const kind = getLibraryFilter(product);
  if (kind === "pdfs") return <FileText size={32} strokeWidth={1.5} />;
  if (kind === "videos") return <Video size={32} strokeWidth={1.5} />;
  if (kind === "packs") return <PackageOpen size={32} strokeWidth={1.5} />;
  return <ImageIcon size={32} strokeWidth={1.5} />;
}

/**
 * Conteúdo comprado de verdade: product_entitlements só é gravada pelo
 * servidor (webhook do Mercado Pago). O arquivo é baixado exclusivamente
 * pela rota autenticada /api/produtos/[id]/download.
 */
export default function BibliotecaPage() {
  const { userId, loading } = useCurrentUserId();
  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>("all");

  useEffect(() => {
    if (!userId) return;
    listOwnedProductsForUser(createClient(), userId).then(setFetchedProducts);
  }, [userId]);

  const products = loading ? null : userId ? fetchedProducts : [];

  const filterCounts = useMemo(() => {
    const source = products ?? [];
    return {
      all: source.length,
      images: source.filter((product) => getLibraryFilter(product) === "images").length,
      packs: source.filter((product) => getLibraryFilter(product) === "packs").length,
      pdfs: source.filter((product) => getLibraryFilter(product) === "pdfs").length,
      videos: source.filter((product) => getLibraryFilter(product) === "videos").length,
    };
  }, [products]);

  const visibleProducts = useMemo(() => {
    const source = products ?? [];
    if (filter === "all") return source;
    return source.filter((product) => getLibraryFilter(product) === filter);
  }, [filter, products]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-4 sm:py-7">
      <header>
        <span className="mb-3 block h-1 w-9 rounded-full bg-(--color-accent)" />
        <h1 className="text-2xl font-bold tracking-tight text-(--color-text)">Sua biblioteca</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">
          Seus produtos digitais ficam disponíveis aqui para baixar quando quiser.
        </p>
      </header>

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
        <>
          <nav
            aria-label="Filtrar biblioteca"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
          >
            {FILTERS.map((item) => {
              const active = filter === item.id;
              const count = filterCounts[item.id];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-(--radius-pill) border px-3.5 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "border-(--color-text) bg-(--color-text) text-(--color-bg)"
                      : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:border-(--color-text-subtle) hover:text-(--color-text)"
                  }`}
                >
                  {item.label}
                  <span className={active ? "opacity-70" : "text-(--color-text-subtle)"}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          {visibleProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-(--color-border) px-5 py-8 text-center">
              <p className="text-sm font-medium text-(--color-text)">
                Nenhum produto nesta categoria
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-2 text-xs font-semibold text-(--color-accent-text) hover:underline"
              >
                Ver todos os produtos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {visibleProducts.map((product) => {
                const typeLabel = getFileLabel(product);
                const isPack = getLibraryFilter(product) === "packs";

                return (
                  <article
                    key={product.id}
                    className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)"
                  >
                    <Link
                      href={`/produto/${product.id}`}
                      className={`relative grid aspect-[4/3] place-items-center overflow-hidden border-b border-(--color-border) ${
                        isPack
                          ? "bg-(--color-text) text-(--color-bg)"
                          : "bg-(--color-surface-2) text-(--color-text-muted)"
                      }`}
                      aria-label={`Ver detalhes de ${product.title}`}
                    >
                      {product.coverImage ? (
                        <Image
                          src={product.coverImage}
                          alt={product.title}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 50vw, 320px"
                          className="object-cover"
                        />
                      ) : (
                        <ProductTypeIcon product={product} />
                      )}

                      <span className="absolute right-2.5 top-2.5 rounded-(--radius-pill) bg-(--color-surface) px-2 py-1 text-[10px] font-bold text-(--color-text) shadow-sm">
                        {typeLabel}
                      </span>
                    </Link>

                    <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                      <span className="mb-2 w-fit rounded-(--radius-pill) bg-(--color-success-soft) px-2 py-1 text-[10px] font-semibold text-(--color-success)">
                        Comprado
                      </span>

                      <Link href={`/produto/${product.id}`} className="min-w-0">
                        <h2 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-(--color-text)">
                          {product.title}
                        </h2>
                      </Link>

                      <p className="mt-1 truncate text-xs text-(--color-text-muted)">
                        {PRODUCT_TYPE_LABELS[product.type]}
                      </p>

                      <a
                        href={`/api/produtos/${product.id}/download`}
                        className={`mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-(--radius-pill) px-3 py-2 text-xs font-semibold transition-colors ${
                          isPack
                            ? "bg-(--color-text) text-(--color-bg) hover:opacity-90"
                            : "bg-(--color-accent) text-(--color-on-accent) hover:bg-(--color-accent-hover)"
                        }`}
                      >
                        <Download size={14} strokeWidth={1.8} />
                        Baixar
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
