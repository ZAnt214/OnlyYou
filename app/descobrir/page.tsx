import { productRepository } from "@/lib/repositories/ProductRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { categoryRepository } from "@/lib/repositories/CategoryRepository";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";
import { Search } from "lucide-react";

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
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <form className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-(--radius-pill) bg-(--color-surface-2) px-4 py-2.5">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-(--color-text-subtle)" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar conteúdos, tags ou criadores"
            className="w-full bg-transparent text-sm text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-(--radius-pill) bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
        >
          Buscar
        </button>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip href={buildQuery({ categoria: "" })} active={!categoria}>
          Todas
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            href={buildQuery({ categoria: c.slug })}
            active={categoria === c.slug}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        {SORTS.map((s) => (
          <Chip key={s.value} href={buildQuery({ sort: s.value })} active={sort === s.value}>
            {s.label}
          </Chip>
        ))}
        <Chip href={buildQuery({ ofertas: ofertas ? "" : "1" })} active={Boolean(ofertas)}>
          Só ofertas
        </Chip>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nada encontrado"
          description="Tente outra busca ou remova os filtros aplicados."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} creatorName={nameById.get(p.creatorId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap rounded-(--radius-pill) border px-4 py-1.5 text-sm ${
        active
          ? "border-transparent bg-(--color-accent-soft) font-medium text-(--color-accent)"
          : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:bg-(--color-surface-2)"
      }`}
    >
      {children}
    </Link>
  );
}
