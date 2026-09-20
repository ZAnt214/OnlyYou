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

// Categorias "descontraídas" — o resto do catálogo (lib/data/categories.ts)
// é considerado profissional/serviço. Só decide em qual das duas seções da
// vitrine a categoria cai, não muda nada na busca/filtro em si.
const CASUAL_CATEGORY_SLUGS = new Set([
  "memes",
  "humor",
  "curiosidades",
  "culinaria",
  "fitness",
  "moda-e-beleza",
  "viagem",
  "pets",
  "astrologia",
  "motivacional",
  "financas-pessoais",
  "diy-artesanato",
  "podcasts",
  "livros",
  "cinema-e-series",
  "esportes",
  "gaming",
]);

// Tons decorativos só de vitrine (ver app/globals.css) — nunca usados pra
// estado ativo, isso continua exclusivamente --color-accent.
const TAG_COLORS = [
  { bg: "bg-(--color-tag-rose)", fg: "text-(--color-tag-rose-fg)" },
  { bg: "bg-(--color-tag-amber)", fg: "text-(--color-tag-amber-fg)" },
  { bg: "bg-(--color-tag-sky)", fg: "text-(--color-tag-sky-fg)" },
  { bg: "bg-(--color-tag-violet)", fg: "text-(--color-tag-violet-fg)" },
  { bg: "bg-(--color-tag-teal)", fg: "text-(--color-tag-teal-fg)" },
  { bg: "bg-(--color-tag-pink)", fg: "text-(--color-tag-pink-fg)" },
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

  const professionalCategories = categories.filter((c) => !CASUAL_CATEGORY_SLUGS.has(c.slug));
  const casualCategories = categories.filter((c) => CASUAL_CATEGORY_SLUGS.has(c.slug));
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
      <div className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
            <Compass size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-base font-semibold text-(--color-text)">Explorar</h1>
            <p className="text-xs text-(--color-text-subtle)">
              Descubra criadores, serviços e produtos pra o seu projeto
            </p>
          </div>
        </div>

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
      </div>

      <CategoryGrid
        title="Categorias profissionais"
        categories={professionalCategories}
        activeSlug={categoria}
        buildQuery={buildQuery}
      />

      <CategoryGrid
        title="Só por diversão"
        categories={casualCategories}
        activeSlug={categoria}
        buildQuery={buildQuery}
        colorOffset={professionalCategories.length}
      />

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
        <div className="flex items-center justify-between">
          <p className="text-sm text-(--color-text-muted)">
            Mostrando resultados em{" "}
            <span className="font-medium text-(--color-text)">{activeCategory.name}</span>
          </p>
          <Link
            href={buildQuery({ categoria: "" })}
            className="text-xs font-medium text-(--color-accent) hover:underline"
          >
            Limpar filtro
          </Link>
        </div>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

function CategoryGrid({
  title,
  categories,
  activeSlug,
  buildQuery,
  colorOffset = 0,
}: {
  title: string;
  categories: { id: string; slug: string; name: string }[];
  activeSlug: string;
  buildQuery: (overrides: Record<string, string>) => string;
  colorOffset?: number;
}) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-(--color-text-muted)">{title}</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {categories.map((c, i) => {
          const Icon = CATEGORY_ICONS[c.slug] ?? Grid3x3;
          const active = activeSlug === c.slug;
          const tag = TAG_COLORS[(i + colorOffset) % TAG_COLORS.length];
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
                  active ? "bg-(--color-accent) text-white" : `${tag.bg} ${tag.fg}`
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
