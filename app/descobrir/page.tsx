import { productRepository } from "@/lib/repositories/ProductRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { categoryRepository } from "@/lib/repositories/CategoryRepository";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";

const SORTS = [
  { value: "", label: "Relevância" },
  { value: "vendidos", label: "Mais vendidos" },
  { value: "recentes", label: "Novidades" },
] as const;

export default async function DescobrirPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; sort?: string; ofertas?: string }>;
}) {
  const { q = "", categoria = "", sort = "", ofertas = "" } = await searchParams;
  const [allProducts, creators, categories] = await Promise.all([
    productRepository.search(q),
    userRepository.findCreators(),
    categoryRepository.findAll(),
  ]);

  let products = allProducts.filter(
    (p) =>
      p.status === "approved" &&
      (!categoria || p.category === categoria) &&
      (!ofertas || p.promoPrice !== undefined),
  );

  if (sort === "vendidos") {
    products = [...products].sort((a, b) => b.salesCount - a.salesCount);
  } else if (sort === "recentes") {
    products = [...products].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  const nameById = new Map(creators.map((c) => [c.id, c.displayName]));

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams({ q, categoria, sort, ofertas, ...overrides });
    for (const [key, value] of [...params.entries()]) {
      if (!value) params.delete(key);
    }
    const qs = params.toString();
    return qs ? `/descobrir?${qs}` : "/descobrir";
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-(--color-text)">Descobrir</h1>
        <form className="flex max-w-md items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar produtos, tags ou descrições"
            className="w-full rounded-(--radius-pill) border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-(--radius-pill) bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildQuery({ categoria: "" })}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            !categoria
              ? "border-(--color-accent) text-(--color-accent)"
              : "border-(--color-border) text-(--color-text-muted)"
          }`}
        >
          Todas
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildQuery({ categoria: c.slug })}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              categoria === c.slug
                ? "border-(--color-accent) text-(--color-accent)"
                : "border-(--color-border) text-(--color-text-muted)"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-y border-(--color-border) py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-(--color-text-subtle)">Ordenar:</span>
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={buildQuery({ sort: s.value })}
              className={
                sort === s.value
                  ? "font-medium text-(--color-text)"
                  : "text-(--color-text-muted) hover:text-(--color-text)"
              }
            >
              {s.label}
            </Link>
          ))}
        </div>
        <Link
          href={buildQuery({ ofertas: ofertas ? "" : "1" })}
          className={`ml-auto rounded-md border px-3 py-1.5 ${
            ofertas
              ? "border-(--color-accent) text-(--color-accent)"
              : "border-(--color-border) text-(--color-text-muted)"
          }`}
        >
          Só ofertas
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} creatorName={nameById.get(p.creatorId)} />
          ))}
        </div>
      )}
    </div>
  );
}
