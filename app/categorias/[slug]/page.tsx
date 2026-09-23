import { notFound } from "next/navigation";
import { userRepository } from "@/lib/repositories/UserRepository";
import { listApprovedProductsByCategory } from "@/lib/supabase/products";
import { categoryRepository } from "@/lib/repositories/CategoryRepository";
import { ProductCard } from "@/components/ProductCard";
import { GigCard } from "@/components/GigCard";
import { createPublicClient } from "@/lib/supabase/public";
import { listActiveGigsByCategory } from "@/lib/supabase/gigs";
import { listUsersByIds } from "@/lib/supabase/profile";
import { GIG_CATEGORY_LABELS, type GigCategory } from "@/lib/types";

const GIG_CATEGORY_SLUGS = new Set(Object.keys(GIG_CATEGORY_LABELS));

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await categoryRepository.findBySlug(slug);
  if (!category) notFound();

  if (slug === "elojob" || slug === "jogue-comigo") {
    const supabase = createPublicClient();
    const gigs = await listActiveGigsByCategory(
      supabase,
      slug === "elojob" ? "elojob" : "play_together",
    ).catch(() => []);
    const creatorNames = Object.fromEntries(
      (await listUsersByIds(supabase, [...new Set(gigs.map((gig) => gig.creatorId))]).catch(() => []))
        .map((creator) => [creator.id, creator.displayName]),
    );

    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-(--color-text)">{category.name}</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">
            {slug === "elojob"
              ? "Compare jogo, elo atual, elo desejado, prazo e preço."
              : "Escolha o jogo e confira o preço e a duração de cada sessão."}
          </p>
        </div>
        {gigs.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Nenhum serviço publicado nesta categoria ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} creatorName={creatorNames[gig.creatorId]} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Categorias que servem tanto produtos quanto serviços (mesmo slug nos
  // dois catálogos, ver lib/types/gig.ts) mostram os dois lado a lado —
  // as demais (fotos, memes, receitas etc.) são exclusivas de produto.
  const isSharedCategory = GIG_CATEGORY_SLUGS.has(slug);

  const [approved, creators, gigs] = await Promise.all([
    listApprovedProductsByCategory(createPublicClient(), slug),
    userRepository.findCreators(),
    isSharedCategory
      ? listActiveGigsByCategory(createPublicClient(), slug as Exclude<GigCategory, "general">).catch(() => [])
      : Promise.resolve([]),
  ]);
  const nameById = new Map(creators.map((c) => [c.id, c.displayName]));

  if (!approved.length && !gigs.length) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        <h1 className="text-xl font-semibold text-(--color-text)">{category.name}</h1>
        <p className="text-sm text-(--color-text-muted)">
          {isSharedCategory ? "Nenhum serviço ou produto publicado nesta categoria ainda." : "Nenhum produto publicado ainda."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
      <h1 className="text-xl font-semibold text-(--color-text)">{category.name}</h1>
      {gigs.length ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Serviços</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} creatorName={nameById.get(gig.creatorId)} />
            ))}
          </div>
        </div>
      ) : null}
      {approved.length ? (
        <div>
          {isSharedCategory ? (
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Produtos digitais</h2>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {approved.map((p) => (
              <ProductCard key={p.id} product={p} creatorName={nameById.get(p.creatorId)} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
