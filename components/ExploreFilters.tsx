"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

const SORTS = [
  { value: "", label: "Relevância" },
  { value: "vendidos", label: "Mais vendidos" },
  { value: "recentes", label: "Novidades" },
] as const;

type FilterState = { category: string; sort: string; offers: boolean };
type ExploreContextValue = FilterState & {
  setCategory: (value: string) => void;
  setSort: (value: string) => void;
  setOffers: (value: boolean) => void;
};

const ExploreContext = createContext<ExploreContextValue | null>(null);

function useExploreFilters() {
  const value = useContext(ExploreContext);
  if (!value) throw new Error("Explore filters must be used inside ExploreFilterProvider");
  return value;
}

function updateAddress(next: FilterState) {
  const params = new URLSearchParams(window.location.search);
  if (next.category) params.set("categoria", next.category);
  else params.delete("categoria");
  if (next.sort) params.set("sort", next.sort);
  else params.delete("sort");
  if (next.offers) params.set("ofertas", "1");
  else params.delete("ofertas");
  const query = params.toString();
  window.history.replaceState(null, "", query ? `/descobrir?${query}` : "/descobrir");
}

export function ExploreFilterProvider({
  initialCategory,
  initialSort,
  initialOffers,
  children,
}: {
  initialCategory: string;
  initialSort: string;
  initialOffers: boolean;
  children: ReactNode;
}) {
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    sort: initialSort,
    offers: initialOffers,
  });

  useEffect(() => {
    function syncFromAddress() {
      const params = new URLSearchParams(window.location.search);
      setFilters({
        category: params.get("categoria") ?? "",
        sort: params.get("sort") ?? "",
        offers: Boolean(params.get("ofertas")),
      });
    }
    window.addEventListener("popstate", syncFromAddress);
    return () => window.removeEventListener("popstate", syncFromAddress);
  }, []);

  function change(patch: Partial<FilterState>) {
    setFilters((current) => {
      const next = { ...current, ...patch };
      updateAddress(next);
      return next;
    });
  }

  const value = useMemo(
    () => ({
      ...filters,
      setCategory: (category: string) => change({ category }),
      setSort: (sort: string) => change({ sort }),
      setOffers: (offers: boolean) => change({ offers }),
    }),
    [filters],
  );

  return <ExploreContext.Provider value={value}>{children}</ExploreContext.Provider>;
}

export function ExploreCategories({
  popularCategories,
  otherCategories,
}: {
  popularCategories: Category[];
  otherCategories: Category[];
}) {
  const { category, setCategory } = useExploreFilters();
  const categories = [...popularCategories, ...otherCategories];

  return (
    <section className="flex flex-col gap-2.5" aria-label="Categorias">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <h2 className="text-sm font-semibold text-(--color-text)">Explore por categoria</h2>
        {category ? (
          <button type="button" onClick={() => setCategory("")} className="shrink-0 text-xs font-semibold text-(--color-accent) hover:underline">
            Limpar filtro
          </button>
        ) : null}
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <FilterChip active={!category} onClick={() => setCategory("")}>Todas</FilterChip>
        {categories.map((item) => (
          <FilterChip key={item.id} active={category === item.slug} onClick={() => setCategory(item.slug)}>{item.name}</FilterChip>
        ))}
      </div>
    </section>
  );
}

export function ExploreSortFilters() {
  const { sort, offers, setSort, setOffers } = useExploreFilters();
  return (
    <section className="flex flex-col gap-1 border-t border-(--color-border) pt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-(--color-text)">Ordenar</span>
        {sort || offers ? (
          <button type="button" onClick={() => { setSort(""); setOffers(false); }} className="ml-auto text-xs font-medium text-(--color-accent)">Limpar</button>
        ) : null}
      </div>
      <div className="no-scrollbar -mx-1 flex items-center gap-5 overflow-x-auto px-1">
        {SORTS.map((item) => <FilterChip key={item.value} active={sort === item.value} onClick={() => setSort(item.value)}>{item.label}</FilterChip>)}
        <FilterChip active={offers} onClick={() => setOffers(!offers)}>Só ofertas</FilterChip>
      </div>
    </section>
  );
}

export function ExploreResultSummary({ categories, query }: { categories: Category[]; query: string }) {
  const { category } = useExploreFilters();
  const activeCategory = categories.find((item) => item.slug === category);
  if (!activeCategory && !query) return null;
  return (
    <div className="flex items-center gap-2 border-l-2 border-(--color-accent) pl-3 text-sm text-(--color-text-muted)" aria-live="polite">
      <Search size={16} className="shrink-0 text-(--color-accent)" />
      <span>
        {query ? <>Resultados para <strong className="font-semibold text-(--color-text)">“{query}”</strong></> : null}
        {query && activeCategory ? " em " : null}
        {activeCategory ? <strong className="font-semibold text-(--color-text)">{activeCategory.name}</strong> : null}
      </span>
    </div>
  );
}

export function ExploreProducts({ products, creatorNames }: { products: Product[]; creatorNames: Record<string, string> }) {
  const { category, sort, offers } = useExploreFilters();
  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => (!category || product.category === category) && (!offers || product.promoPrice !== undefined));
    if (sort === "vendidos") return [...filtered].sort((a, b) => b.salesCount - a.salesCount);
    if (sort === "recentes") return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return filtered;
  }, [products, category, sort, offers]);
  const activeCategory = category ? visibleProducts[0]?.category : "";

  if (!visibleProducts.length) return null;
  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <div className="border-t border-(--color-border) pt-5">
        <h2 className="text-xl font-bold tracking-tight text-(--color-text)">{activeCategory ? "Produtos selecionados" : "Produtos digitais"}</h2>
        <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">{visibleProducts.length} {visibleProducts.length === 1 ? "opção encontrada" : "opções encontradas"} para você.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {visibleProducts.map((product) => <ProductCard key={product.id} product={product} creatorName={creatorNames[product.creatorId]} />)}
      </div>
    </section>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`shrink-0 whitespace-nowrap border-b-2 px-1 py-2 text-sm transition-colors ${active ? "border-(--color-accent) font-semibold text-(--color-accent)" : "border-transparent text-(--color-text-muted) hover:text-(--color-text)"}`}>
      {children}
    </button>
  );
}
