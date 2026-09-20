import { productRepository } from "@/lib/repositories/ProductRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { categoryRepository } from "@/lib/repositories/CategoryRepository";
import { createPublicClient } from "@/lib/supabase/public";
import { searchActiveGigs } from "@/lib/supabase/gigs";
import { listUsersByIds } from "@/lib/supabase/profile";
import { GigCard } from "@/components/GigCard";
import { CreatorCard } from "@/components/CreatorCard";
import { EmptyState } from "@/components/EmptyState";
import {
  ExploreCategories,
  ExploreFilterProvider,
  ExploreProducts,
  ExploreResultSummary,
  ExploreSortFilters,
} from "@/components/ExploreFilters";
import Link from "next/link";
import { Search } from "lucide-react";

// Recorte curado pra vitrine — o catálogo completo (lib/data/categories.ts)
// tem dezenas de opções, mas listar tudo de cara polui a página. O resto
// continua acessível pelos chips logo abaixo.
const POPULAR_CATEGORY_SLUGS = [
  "design",
  "programacao",
  "marketing",
  "musica",
  "videos",
  "ui-ux",
  "redacao-e-copywriting",
  "consultorias",
];

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default async function DescobrirPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; sort?: string; ofertas?: string }>;
}) {
  const { q = "", categoria = "", sort = "", ofertas = "" } = await searchParams;
  const supabase = createPublicClient();
  const [allProducts, creators, categories, gigs] = await Promise.all([
    productRepository.search(q),
    userRepository.findCreators(),
    categoryRepository.findAll(),
    // Sem busca, searchActiveGigs já cai pra listActiveGigs (mais recentes,
    // limitado) — é o que alimenta a vitrine de "Serviços em destaque" da
    // página de Explorar. Um problema pontual no Supabase degrada pra
    // "sem serviços encontrados", não quebra a página inteira.
    searchActiveGigs(supabase, q).catch(() => []),
  ]);
  const gigCreatorNameById = new Map(
    (await listUsersByIds(supabase, [...new Set(gigs.map((g) => g.creatorId))]).catch(() => [])).map(
      (c) => [c.id, c.displayName],
    ),
  );

  const products = allProducts.filter((p) => p.status === "approved");

  // A busca de produtos (título/descrição/tags) não encontra um criador sem
  // produto publicado — comparar também username/nome mantém a promessa do
  // placeholder ("Buscar conteúdos, tags ou criadores").
  const qNormalized = normalizeSearchText(q.trim());
  const matchingCreators = qNormalized
    ? creators.filter(
        (c) =>
          normalizeSearchText(c.username).includes(qNormalized) ||
          normalizeSearchText(c.displayName).includes(qNormalized),
      )
    : creators.slice(0, 6);

  const popularCategories = POPULAR_CATEGORY_SLUGS.map((slug) =>
    categories.find((c) => c.slug === slug),
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const otherCategories = categories.filter((c) => !POPULAR_CATEGORY_SLUGS.includes(c.slug));
  const creatorNames = Object.fromEntries(creators.map((creator) => [creator.id, creator.displayName]));

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams({ q, categoria, sort, ofertas, ...overrides });
    for (const [key, value] of [...params.entries()]) {
      if (!value) params.delete(key);
    }
    const qs = params.toString();
    return qs ? `/descobrir?${qs}` : "/descobrir";
  }

  return (
    <ExploreFilterProvider initialCategory={categoria} initialSort={sort} initialOffers={Boolean(ofertas)}>
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-4 sm:py-7">
      <section className="py-3 sm:py-5">
        <div className="max-w-xl">
          <span className="mb-4 block h-1 w-10 rounded-full bg-(--color-accent)" />
          <h1 className="text-3xl font-bold leading-[1.12] tracking-tight text-(--color-text) sm:text-4xl">
            Encontre o talento certo para tirar sua ideia do papel.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-(--color-text-muted) sm:text-base">
            Profissionais, serviços e produtos digitais reunidos para o seu próximo projeto.
          </p>

          <form className="mt-6 flex items-center gap-2 rounded-(--radius-pill) border border-(--color-border) bg-(--color-surface) p-1.5 shadow-sm focus-within:border-(--color-accent)">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
              <Search size={18} strokeWidth={1.7} className="shrink-0 text-(--color-text-subtle)" />
              <input
                name="q"
                defaultValue={q}
                placeholder="O que você está procurando?"
                aria-label="Buscar no Jobê"
                className="min-w-0 w-full bg-transparent py-2 text-sm text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-(--radius-pill) bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--color-accent-hover)"
            >
              Buscar
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span className="text-(--color-text-subtle)">Mais buscados</span>
            {["Sites", "Logotipos", "Edição de vídeos"].map((term) => (
              <Link
                key={term}
                href={buildQuery({ q: term })}
                className="font-medium text-(--color-text-muted) underline decoration-(--color-border) underline-offset-4 transition-colors hover:text-(--color-accent)"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ExploreCategories popularCategories={popularCategories} otherCategories={otherCategories} />
      <ExploreSortFilters />
      <ExploreResultSummary categories={categories} query={q} />

      {matchingCreators.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionHeading
            title={qNormalized ? "Profissionais encontrados" : "Profissionais em destaque"}
            description={qNormalized ? "Perfis que combinam com a sua busca." : "Conheça quem está criando e trabalhando no Jobê."}
          />
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {matchingCreators.map((creator) => (
              <div key={creator.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
                <CreatorCard creator={creator} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {gigs.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionHeading
            title={qNormalized ? "Serviços encontrados" : "Serviços para tirar ideias do papel"}
            description="Compare opções e encontre o profissional certo para o que você precisa."
          />
          <div className="grid grid-cols-2 gap-3">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} creatorName={gigCreatorNameById.get(g.creatorId)} />
            ))}
          </div>
        </section>
      ) : null}

      {products.length > 0 ? (
        <ExploreProducts products={products} creatorNames={creatorNames} />
      ) : matchingCreators.length === 0 && gigs.length === 0 ? (
        <div className="border-t border-(--color-border) py-8">
          <EmptyState
            icon={Search}
            title="Nada encontrado"
            description="Tente outra busca ou remova os filtros aplicados."
          />
        </div>
      ) : null}
    </div>
    </ExploreFilterProvider>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-t border-(--color-border) pt-5">
      <h2 className="text-xl font-bold tracking-tight text-(--color-text)">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">{description}</p>
    </div>
  );
}
