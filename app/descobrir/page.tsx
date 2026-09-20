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
import {
  Compass,
  Search,
  BadgeCheck,
  BriefcaseBusiness,
  type LucideIcon,
} from "lucide-react";

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
  const qNormalized = q.trim().toLowerCase();
  const matchingCreators = qNormalized
    ? creators.filter(
        (c) =>
          c.username.toLowerCase().includes(qNormalized) ||
          c.displayName.toLowerCase().includes(qNormalized),
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-4">
      <section className="relative overflow-hidden rounded-3xl border border-(--color-border) bg-(--color-surface) px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-(--color-accent-soft) opacity-70" />
        <div className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full bg-(--color-accent-soft) opacity-40" />

        <div className="relative flex flex-col gap-5">
          <div className="max-w-lg">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--color-text-muted)">
              <Compass size={15} strokeWidth={1.8} className="text-(--color-accent)" />
              Encontre no Jobê
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-(--color-text) sm:text-3xl">
              Encontre quem faz o que seu projeto precisa.
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-(--color-text-muted)">
              Explore profissionais, serviços e produtos digitais em um só lugar.
            </p>
          </div>

          <form className="flex items-center gap-2 rounded-(--radius-pill) border border-(--color-border) bg-(--color-surface) p-1.5 shadow-sm">
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

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-(--color-accent)">Buscas populares:</span>
            {["Sites", "Logotipos", "Edição de vídeos"].map((term) => (
              <Link
                key={term}
                href={buildQuery({ q: term })}
                className="rounded-(--radius-pill) border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-(--color-text-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
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
            icon={BadgeCheck}
            eyebrow="Talentos"
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
            icon={BriefcaseBusiness}
            eyebrow="Serviços"
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
        <div className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-6">
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
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--color-accent-soft) text-(--color-accent)">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-(--color-accent)">{eyebrow}</p>
        <h2 className="text-lg font-bold tracking-tight text-(--color-text)">{title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-(--color-text-muted)">{description}</p>
      </div>
    </div>
  );
}

