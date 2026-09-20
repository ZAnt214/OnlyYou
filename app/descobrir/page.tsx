import { productRepository } from "@/lib/repositories/ProductRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { categoryRepository } from "@/lib/repositories/CategoryRepository";
import { createPublicClient } from "@/lib/supabase/public";
import { searchActiveGigs } from "@/lib/supabase/gigs";
import { listUsersByIds } from "@/lib/supabase/profile";
import { ProductCard } from "@/components/ProductCard";
import { GigCard } from "@/components/GigCard";
import { CreatorCard } from "@/components/CreatorCard";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";
import {
  Compass,
  Search,
  Palette,
  Megaphone,
  Code2,
  Music,
  Video,
  Layers,
  PenLine,
  Share2,
  Languages,
  Briefcase,
  Camera,
  Paintbrush,
  Gamepad2,
  GraduationCap,
  BookOpen,
  BookMarked,
  LayoutTemplate,
  Star,
  Wrench,
  Globe,
  Package,
  Grid3x3,
  Laugh,
  Smile,
  Sparkles,
  UtensilsCrossed,
  Dumbbell,
  Shirt,
  Plane,
  PawPrint,
  Moon,
  Flame,
  Wallet,
  Scissors,
  Mic,
  Clapperboard,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const SORTS = [
  { value: "", label: "Relevância" },
  { value: "vendidos", label: "Mais vendidos" },
  { value: "recentes", label: "Novidades" },
] as const;

// Ícone por categoria — Category (lib/types/product.ts) não tem campo de
// ícone, então o mapeamento vive aqui, ao lado de quem exibe. Fallback pra
// categorias futuras que ainda não tiverem entrada (Grid3x3 genérico).
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  fotos: Camera,
  videos: Video,
  "packs-digitais": Package,
  arte: Paintbrush,
  design: Palette,
  musica: Music,
  gaming: Gamepad2,
  tutoriais: GraduationCap,
  educacao: BookOpen,
  ebooks: BookMarked,
  templates: LayoutTemplate,
  "conteudo-exclusivo": Star,
  "servicos-personalizados": Wrench,
  consultorias: Briefcase,
  marketing: Megaphone,
  "social-media": Share2,
  programacao: Code2,
  "desenvolvimento-web": Globe,
  "ui-ux": Layers,
  "redacao-e-copywriting": PenLine,
  traducao: Languages,
  memes: Laugh,
  humor: Smile,
  curiosidades: Sparkles,
  culinaria: UtensilsCrossed,
  fitness: Dumbbell,
  "moda-e-beleza": Shirt,
  viagem: Plane,
  pets: PawPrint,
  astrologia: Moon,
  motivacional: Flame,
  "financas-pessoais": Wallet,
  "diy-artesanato": Scissors,
  podcasts: Mic,
  livros: BookMarked,
  "cinema-e-series": Clapperboard,
  esportes: Trophy,
};

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
  const activeCategory = categories.find((c) => c.slug === categoria);

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams({ q, categoria, sort, ofertas, ...overrides });
    for (const [key, value] of [...params.entries()]) {
      if (!value) params.delete(key);
    }
    const qs = params.toString();
    return qs ? `/descobrir?${qs}` : "/descobrir";
  }

  return (
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

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-(--color-text-muted)">Categorias populares</h2>
          {categoria ? (
            <Link
              href={buildQuery({ categoria: "" })}
              className="text-xs font-medium text-(--color-accent) hover:underline"
            >
              Limpar filtro
            </Link>
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {popularCategories.map((c) => {
            const Icon = CATEGORY_ICONS[c.slug] ?? Grid3x3;
            const active = categoria === c.slug;
            return (
              <Link
                key={c.id}
                href={buildQuery({ categoria: active ? "" : c.slug })}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-colors ${
                  active
                    ? "border-(--color-accent) bg-(--color-accent-soft)"
                    : "border-(--color-border) bg-(--color-surface) hover:border-(--color-accent)"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    active
                      ? "bg-(--color-accent) text-white"
                      : "bg-(--color-surface-2) text-(--color-text-muted)"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span
                  className={`text-xs font-medium leading-tight ${
                    active ? "text-(--color-accent)" : "text-(--color-text)"
                  }`}
                >
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
          <Chip href={buildQuery({ categoria: "" })} active={!categoria}>
            Todas
          </Chip>
          {otherCategories.map((c) => (
            <Chip key={c.id} href={buildQuery({ categoria: c.slug })} active={categoria === c.slug}>
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        {SORTS.map((s) => (
          <Chip key={s.value} href={buildQuery({ sort: s.value })} active={sort === s.value}>
            {s.label}
          </Chip>
        ))}
        <Chip href={buildQuery({ ofertas: ofertas ? "" : "1" })} active={Boolean(ofertas)}>
          Só ofertas
        </Chip>
      </div>

      {activeCategory ? (
        <p className="text-sm text-(--color-text-muted)">
          Mostrando resultados em <span className="font-medium text-(--color-text)">{activeCategory.name}</span>
        </p>
      ) : null}

      {matchingCreators.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-(--color-text-muted)">
            {qNormalized ? "Criadores" : "Criadores em destaque"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {matchingCreators.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
          </div>
        </div>
      ) : null}

      {gigs.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-(--color-text-muted)">
            {qNormalized ? "Serviços" : "Serviços em destaque"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} creatorName={gigCreatorNameById.get(g.creatorId)} />
            ))}
          </div>
        </div>
      ) : null}

      {products.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-(--color-text-muted)">
            {activeCategory ? activeCategory.name : qNormalized ? "Produtos" : "Produtos em destaque"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} creatorName={nameById.get(p.creatorId)} />
            ))}
          </div>
        </div>
      ) : matchingCreators.length === 0 && gigs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nada encontrado"
          description="Tente outra busca ou remova os filtros aplicados."
        />
      ) : null}
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
