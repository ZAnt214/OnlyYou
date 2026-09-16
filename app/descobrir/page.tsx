import { productRepository } from "@/lib/repositories/ProductRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { categoryRepository } from "@/lib/repositories/CategoryRepository";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";

export default async function DescobrirPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q = "", categoria = "" } = await searchParams;
  const [allProducts, creators, categories] = await Promise.all([
    productRepository.search(q),
    userRepository.findCreators(),
    categoryRepository.findAll(),
  ]);

  const products = allProducts.filter(
    (p) => p.status === "approved" && (!categoria || p.category === categoria),
  );
  const nameById = new Map(creators.map((c) => [c.id, c.displayName]));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-(--color-text)">Descobrir</h1>
        <form className="flex max-w-md items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar produtos, tags ou descrições"
            className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md border border-(--color-border) px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface)"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/descobrir"
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
            href={`/descobrir?categoria=${c.slug}`}
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
