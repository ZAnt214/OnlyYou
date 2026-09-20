"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Briefcase,
  Camera,
  Clapperboard,
  Code2,
  Grid3x3,
  Layers,
  Megaphone,
  Music,
  Palette,
  PenLine,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

const SORTS = [
  { value: "", label: "Relevância" },
  { value: "vendidos", label: "Mais vendidos" },
  { value: "recentes", label: "Novidades" },
] as const;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  design: Palette,
  programacao: Code2,
  marketing: Megaphone,
  musica: Music,
  videos: Video,
  "ui-ux": Layers,
  "redacao-e-copywriting": PenLine,
  consultorias: Briefcase,
  fotos: Camera,
  "cinema-e-series": Clapperboard,
};

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

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--color-accent)">Explore por área</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-(--color-text)">Categorias populares</h2>
        </div>
        {category ? (
          <button type="button" onClick={() => setCategory("")} className="shrink-0 text-xs font-semibold text-(--color-accent) hover:underline">
            Limpar filtro
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {popularCategories.map((item) => {
          const Icon = CATEGORY_ICONS[item.slug] ?? Grid3x3;
          const active = category === item.slug;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setCategory(active ? "" : item.slug)}
              aria-pressed={active}
              className={`group flex min-h-28 flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                active ? "border-(--color-accent) bg-(--color-accent-soft)" : "border-(--color-border) bg-(--color-surface) hover:border-(--color-accent)"
              }`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-(--color-accent) text-white" : "bg-(--color-surface-2) text-(--color-text-muted) group-hover:text-(--color-accent)"}`}>
                <Icon size={19} strokeWidth={1.75} />
              </span>
              <span className="flex w-full items-end justify-between gap-2">
                <span className={`text-sm font-semibold leading-tight ${active ? "text-(--color-accent)" : "text-(--color-text)"}`}>{item.name}</span>
                <ArrowRight size={15} className={active ? "text-(--color-accent)" : "text-(--color-text-subtle)"} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip active={!category} onClick={() => setCategory("")}>Todas</FilterChip>
        {otherCategories.map((item) => (
          <FilterChip key={item.id} active={category === item.slug} onClick={() => setCategory(item.slug)}>{item.name}</FilterChip>
        ))}
      </div>
    </section>
  );
}

export function ExploreSortFilters() {
  const { sort, offers, setSort, setOffers } = useExploreFilters();
  return (
    <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-3">
      <div className="mb-3 flex items-center gap-2 px-1">
        <SlidersHorizontal size={16} className="text-(--color-accent)" />
        <span className="text-sm font-semibold text-(--color-text)">Ordenar e filtrar</span>
        {sort || offers ? (
          <button type="button" onClick={() => { setSort(""); setOffers(false); }} className="ml-auto text-xs font-medium text-(--color-accent)">Limpar</button>
        ) : null}
      </div>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
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
    <div className="flex items-center gap-2 rounded-2xl bg-(--color-surface-2) px-4 py-3 text-sm text-(--color-text-muted)" aria-live="polite">
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
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--color-accent-soft) text-(--color-accent)"><ShoppingBag size={18} strokeWidth={1.8} /></span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-(--color-accent)">Produtos digitais</p>
          <h2 className="text-lg font-bold tracking-tight text-(--color-text)">{activeCategory ? "Produtos selecionados" : "Prontos para usar"}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-(--color-text-muted)">{visibleProducts.length} {visibleProducts.length === 1 ? "opção encontrada" : "opções encontradas"} para você.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {visibleProducts.map((product) => <ProductCard key={product.id} product={product} creatorName={creatorNames[product.creatorId]} />)}
      </div>
    </section>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`shrink-0 whitespace-nowrap rounded-(--radius-pill) border px-4 py-1.5 text-sm transition-colors ${active ? "border-transparent bg-(--color-accent-soft) font-medium text-(--color-accent)" : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:bg-(--color-surface-2)"}`}>
      {children}
    </button>
  );
}
