import Link from "next/link";
import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { ArrowUpRight, Search } from "lucide-react";
import type { Gig, Product, User } from "@/lib/types";
import { createPublicClient } from "@/lib/supabase/public";
import { listActiveGigs } from "@/lib/supabase/gigs";
import { listApprovedProducts } from "@/lib/supabase/products";
import { listUsersByIds } from "@/lib/supabase/profile";
import { ProductCard } from "@/components/ProductCard";
import { GigCard } from "@/components/GigCard";
import { CreatorCard } from "@/components/CreatorCard";
import { FeedPostCard } from "@/components/FeedPostCard";
import { GigFeedCard } from "@/components/GigFeedCard";
import { EmptyState } from "@/components/EmptyState";
import { TypewriterHeadline } from "@/components/TypewriterHeadline";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Jobê — Encontre quem faz",
  description:
    "Conheça profissionais, contrate serviços sob medida e descubra produtos digitais. Seu próximo projeto começa com uma boa conversa.",
};

const categories = [
  ["design", "Design", "Uma marca com a sua cara"],
  ["programacao", "Programação", "Do site à sua próxima ideia"],
  ["marketing", "Marketing", "Seu negócio mais conhecido"],
  ["videos", "Vídeo", "Histórias que prendem atenção"],
  ["redacao-e-copywriting", "Escrita", "As palavras certas"],
  ["templates", "Templates", "Um bom ponto de partida"],
  ["jogue-comigo", "Jogue comigo", "Sua próxima partida, em companhia"],
  ["elojob", "Elojob", "Encontre serviços para seu jogo"],
] as const;

const heroPhrases = [
  "Encontre quem faz.",
  "Venda o que você sabe.",
  "Peça sob medida.",
  "Publique seus serviços.",
  "Escolha com confiança.",
  "Seu talento vira renda.",
] as const;

const questions = [
  [
    "Qual a diferença entre serviço e produto digital?",
    "Um serviço é feito por um profissional para atender ao que você precisa. Um produto digital já está pronto: veja a descrição e os arquivos incluídos antes de comprar.",
  ],
  [
    "Posso pedir algo diferente do anúncio?",
    "Sim. Acesse o perfil do profissional e envie um pedido personalizado. Na conversa, vocês combinam o escopo, o preço e o prazo antes de fechar a proposta.",
  ],
  [
    "Onde acompanho meu pedido?",
    "As conversas e os pedidos personalizados ficam em Mensagens. Os produtos digitais comprados ficam na Biblioteca, após a confirmação do pagamento.",
  ],
  [
    "Como funciona Jogue comigo?",
    "O profissional informa o jogo, a plataforma, o preço da sessão e a duração em minutos. Antes de contratar, combine o horário e os detalhes na conversa.",
  ],
  [
    "Como começo a oferecer meu trabalho?",
    "Crie sua conta e acesse a área do criador. Complete seu perfil, publique seus produtos ou serviços e descreva com clareza o que está incluído, o preço e os prazos.",
  ],
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section
        aria-labelledby="home-title"
        className="grid gap-8 bg-[radial-gradient(circle_at_top_right,var(--color-highlight-soft),transparent_55%),radial-gradient(circle_at_bottom_left,var(--color-accent-soft),transparent_60%)] pb-10 pt-10 sm:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-14"
      >
        <div>
          <p className="mb-4 w-fit rounded-full bg-(--color-highlight-soft) px-3 py-1.5 text-xs font-semibold text-(--color-highlight)">
            Serviços e produtos digitais em um só lugar
          </p>
          <h1
            id="home-title"
            className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-(--color-text) sm:text-5xl lg:text-6xl"
          >
            Encontre. Compare.
            <br />
            <TypewriterHeadline
              phrases={[...heroPhrases]}
              srText="Encontre quem faz ou venda o que você sabe fazer."
            />
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-(--color-text-muted) sm:text-lg">
            Contrate profissionais, compre produtos prontos ou peça exatamente o
            que precisa. No Jobê, você conhece quem faz antes de escolher.
          </p>
          <form
            action="/descobrir"
            role="search"
            aria-label="Buscar no Jobê"
            className="mt-7 flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) p-1.5 pl-4 shadow-sm focus-within:outline-2 focus-within:outline-(--color-accent-text)"
          >
            <Search
              size={20}
              aria-hidden="true"
              className="shrink-0 text-(--color-text-muted)"
            />
            <label htmlFor="home-search" className="sr-only">
              O que você está procurando?
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              maxLength={160}
              placeholder="Busque por serviço, produto ou profissional"
              className="min-w-0 flex-1 bg-transparent py-3 text-base text-(--color-text) outline-none placeholder:text-(--color-text-muted)"
            />
            <button className="min-h-12 shrink-0 rounded-full bg-(--color-accent) px-5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)">
              Buscar
            </button>
          </form>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/descobrir"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--color-accent) px-5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
            >
              Explorar agora
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-semibold text-(--color-text) underline decoration-(--color-border) underline-offset-4"
            >
              Quero vender no Jobê
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-(--color-text-muted)">
            <span>Experimente:</span>
            {["Logotipo", "Edição de vídeo", "Site"].map((term) => (
              <Link
                key={term}
                href={"/descobrir?q=" + encodeURIComponent(term)}
                className="py-1 underline decoration-(--color-border) underline-offset-4 hover:text-(--color-text)"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
        <aside
          aria-label="Formas de comprar no Jobê"
          className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-lg shadow-black/5 sm:p-6"
        >
          <p className="text-sm font-medium text-(--color-highlight)">
            Escolha como começar
          </p>
          <h2 className="mt-1 text-xl font-semibold text-(--color-text)">
            Compre pronto ou peça sob medida
          </h2>
          {[
            [
              "/descobrir",
              "Serviços profissionais",
              "Compare preços, prazos e o que está incluído.",
            ],
            [
              "/descobrir",
              "Produtos digitais",
              "Escolha algo pronto e receba após o pagamento.",
            ],
            [
              "/categorias/jogue-comigo",
              "Jogue comigo",
              "Encontre sessões com duração e preço definidos.",
            ],
          ].map(([href, title, description]) => (
            <Link
              key={title}
              href={href}
              className="group flex min-h-20 items-center justify-between gap-4 border-b border-(--color-border) py-4 last:border-b-0"
            >
              <span>
                <span className="block text-base font-semibold text-(--color-text)">
                  {title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-(--color-text-muted)">
                  {description}
                </span>
              </span>
              <ArrowUpRight
                size={20}
                aria-hidden="true"
                className="shrink-0 text-(--color-text-muted) group-hover:text-(--color-accent-text)"
              />
            </Link>
          ))}
        </aside>
      </section>
      <div className="grid grid-cols-3 gap-3 py-4">
        {[
          ["Preço", "visível"],
          ["Conversa", "antes de fechar"],
          ["Compra", "em um só lugar"],
        ].map(([title, description], i) => (
          <p
            key={title}
            className={
              "rounded-2xl px-2 py-4 text-center text-xs sm:text-sm " +
              (i === 1
                ? "bg-(--color-highlight-soft) text-(--color-highlight)"
                : "bg-(--color-accent-soft) text-(--color-accent-text)")
            }
          >
            <strong className="block font-semibold">{title}</strong>
            {description}
          </p>
        ))}
      </div>
      <nav
        aria-label="Seções da página inicial"
        className="flex flex-wrap gap-x-6 gap-y-1 border-y border-(--color-border) py-2 text-sm text-(--color-text-muted)"
      >
        {[
          ["vitrine", "Vitrine"],
          ["categorias", "Categorias"],
          ["como-funciona", "Como funciona"],
          ["comunidade", "Comunidade"],
          ["duvidas", "Dúvidas"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={"#" + id}
            className="flex min-h-11 items-center hover:text-(--color-text)"
          >
            {label}
          </a>
        ))}
      </nav>
      <Suspense fallback={<CatalogSkeleton />}>
        <Vitrine />
      </Suspense>
      <section
        id="categorias"
        className="scroll-mt-24 border-t border-(--color-border) py-12 sm:py-16"
      >
        <SectionHeading
          title="Um bom começo para cada ideia"
          description="Explore pelo que você precisa, no seu ritmo."
          href="/descobrir"
          label="Todas as categorias"
        />
        <div className="mt-6 grid grid-cols-2 gap-x-6 sm:grid-cols-4">
          {categories.map(([slug, name, description], i) => (
            <Link
              key={slug}
              href={"/categorias/" + slug}
              className="group border-b border-(--color-border) py-5"
            >
              <span
                className={
                  "mb-3 inline-block h-2 w-8 rounded-full " +
                  (i % 2 === 0 ? "bg-(--color-accent)" : "bg-(--color-highlight)")
                }
                aria-hidden="true"
              />
              <span className="flex items-center justify-between gap-2 text-base font-semibold text-(--color-text)">
                {name}
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-(--color-text-muted) group-hover:text-(--color-accent-text)"
                />
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-(--color-text-muted)">
                {description}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section
        id="como-funciona"
        className="scroll-mt-24 border-t border-(--color-border) py-12 sm:py-16"
      >
        <SectionHeading
          title="Do primeiro oi ao trabalho entregue"
          description="Para um serviço sob medida, comece por uma boa conversa."
        />
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            [
              "Encontre seu profissional",
              "Explore os serviços e visite os perfis. Compare o trabalho, a descrição e as avaliações disponíveis.",
            ],
            [
              "Combine os detalhes",
              "Conte o que precisa. Acerte escopo, valor e prazo na conversa antes de aceitar a proposta.",
            ],
            [
              "Acompanhe por aqui",
              "Mantenha as mensagens e a entrega no pedido. Confira o resultado e compartilhe sua avaliação.",
            ],
          ].map(([title, text], i) => (
            <li key={title}>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--color-accent-soft) text-sm font-semibold text-(--color-accent-text)">
                {i + 1}
              </span>
              <h3 className="mb-2 mt-3 text-lg font-semibold">{title}</h3>
              <p className="max-w-sm text-sm leading-relaxed text-(--color-text-muted)">
                {text}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href="/seguranca"
          className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4"
        >
          Conheça os cuidados e as regras do Jobê{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
      <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Transforme seu talento em renda extra hoje!
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-(--color-text-muted)">
          No Jobê, pessoas estão procurando exatamente o que você sabe fazer.
          Publique seus serviços, mostre seu trabalho pra quem precisa e
          comece a fechar pedidos. Comece agora e veja seus ganhos crescerem!
        </p>
        <div className="mt-6 border-t border-(--color-border) pt-6">
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-full bg-(--color-accent) px-6 py-3 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
          >
            Quero oferecer meus serviços <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <Suspense fallback={<CommunitySkeleton />}>
        <Community />
      </Suspense>
      <section
        id="duvidas"
        className="mx-auto max-w-3xl scroll-mt-24 py-12 sm:py-16"
      >
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          Antes de começar
        </h2>
        {questions.map(([question, answer]) => (
          <details
            key={question}
            className="border-b border-(--color-border) py-1"
          >
            <summary className="cursor-pointer py-5 pr-4 text-base font-medium text-(--color-text)">
              {question}
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-(--color-text-muted)">
              {answer}
            </p>
          </details>
        ))}
      </section>
    </div>
  );
}

type FeedItem = { kind: "product"; data: Product } | { kind: "gig"; data: Gig };

const getHomeData = cache(async function getHomeData() {
  const supabase = createPublicClient();
  const [productsResult, gigsResult] = await Promise.allSettled([
    listApprovedProducts(supabase, { limit: 24 }),
    listActiveGigs(supabase, { limit: 12 }),
  ]);
  const approved =
    productsResult.status === "fulfilled" ? productsResult.value : [];
  const gigs = gigsResult.status === "fulfilled" ? gigsResult.value : [];
  const unavailable =
    productsResult.status === "rejected" || gigsResult.status === "rejected";
  // Busca em lote também os autores dos produtos; nunca usa perfis de demonstração.
  const ids = [
    ...new Set([...approved, ...gigs].map((item) => item.creatorId)),
  ];
  const creators = await listUsersByIds(supabase, ids).catch(
    () => [] as User[],
  );
  const creatorById = new Map(creators.map((c) => [c.id, c]));
  const offers = approved
    .filter((p) => p.promoPrice != null && p.promoPrice < p.price)
    .slice(0, 4);
  const feed: FeedItem[] = [
    ...approved.map((data): FeedItem => ({ kind: "product", data })),
    ...gigs.map((data): FeedItem => ({ kind: "gig", data })),
  ].sort((a, b) => Date.parse(b.data.createdAt) - Date.parse(a.data.createdAt));

  return { approved, gigs, unavailable, creators, creatorById, offers, feed };
});

async function Vitrine() {
  const { approved, gigs, unavailable, creatorById, offers, feed } =
    await getHomeData();

  return (
    <section id="vitrine" className="scroll-mt-24 py-12 sm:py-16">
      <SectionHeading
        title="Encontre seu próximo Jobê"
        description="Serviços para contratar. Produtos digitais para levar sua ideia adiante."
        href="/descobrir"
        label="Explorar tudo"
      />
      {unavailable ? (
        <p role="status" className="mt-5 text-sm text-(--color-text-muted)">
          Parte da vitrine está indisponível agora.{" "}
          <Link href="/descobrir" className="underline">
            Tentar na página Explorar
          </Link>
          .
        </p>
      ) : null}
      {gigs.length ? (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">
            Serviços de quem sabe fazer
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gigs.slice(0, 4).map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                creatorName={creatorById.get(gig.creatorId)?.displayName}
              />
            ))}
          </div>
        </div>
      ) : null}
      {approved.length ? (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">
            Novidades em produtos digitais
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {approved.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                creatorName={creatorById.get(product.creatorId)?.displayName}
              />
            ))}
          </div>
        </div>
      ) : null}
      {!feed.length && !unavailable ? (
        <EmptyState
          icon={Search}
          title="O próximo trabalho pode ser o seu"
          description="Novos produtos e serviços aparecerão aqui quando forem publicados."
          action={
            <Link href="/dashboard" className="underline underline-offset-4">
              Publicar meu trabalho
            </Link>
          }
        />
      ) : null}
      {offers.length ? (
        <div className="mt-10">
          <SectionHeading
            title="Uma boa ideia por menos"
            href="/descobrir?ofertas=1"
            label="Ver ofertas"
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {offers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                creatorName={creatorById.get(product.creatorId)?.displayName}
              />
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-5 text-sm font-medium">
        <Link
          href="/descobrir?sort=vendidos"
          className="flex min-h-11 items-center underline underline-offset-4"
        >
          Explorar mais vendidos
        </Link>
        <Link
          href="/descobrir"
          className="flex min-h-11 items-center underline underline-offset-4"
        >
          Ver catálogo completo
        </Link>
      </div>
    </section>
  );
}

async function Community() {
  const { unavailable, creators, creatorById, feed } = await getHomeData();

  return (
    <section
      id="comunidade"
      className="scroll-mt-24 border-t border-(--color-border) py-12 sm:py-16"
    >
      <SectionHeading
        title="Por trás de cada trabalho, alguém"
        description="Conheça os profissionais e acompanhe o que eles estão criando."
        href="/criadores"
        label="Conhecer profissionais"
      />
      {creators.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {creators
            .filter((c) => c.creatorProfile)
            .slice(0, 4)
            .map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
        </div>
      ) : null}
      {feed.length ? (
        <div className="mx-auto mt-10 max-w-2xl">
          <h3 className="mb-5 text-lg font-semibold">
            Acabou de chegar ao feed
          </h3>
          <div className="flex flex-col gap-4">
            {feed.slice(0, 3).map((item) => (
              <FeedItemCard
                key={item.kind + item.data.id}
                item={item}
                creator={creatorById.get(item.data.creatorId)}
              />
            ))}
          </div>
          {feed.length > 3 ? (
            <details className="mt-5">
              <summary className="cursor-pointer py-3 text-center text-sm font-semibold underline underline-offset-4">
                Ver mais publicações
              </summary>
              <div className="mt-4 flex flex-col gap-4">
                {feed.slice(3, 12).map((item) => (
                  <FeedItemCard
                    key={item.kind + item.data.id}
                    item={item}
                    creator={creatorById.get(item.data.creatorId)}
                  />
                ))}
              </div>
              <Link
                href="/descobrir"
                className="mt-6 block py-3 text-center text-sm font-semibold underline"
              >
                Continuar explorando
              </Link>
            </details>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-(--color-text-muted)">
          {unavailable
            ? "As publicações voltarão a aparecer quando a conexão for restabelecida."
            : "As próximas publicações da comunidade aparecerão aqui."}
        </p>
      )}
    </section>
  );
}

function FeedItemCard({ item, creator }: { item: FeedItem; creator?: User }) {
  return item.kind === "gig" ? (
    <GigFeedCard gig={item.data} creator={creator} />
  ) : (
    <FeedPostCard product={item.data} creator={creator} />
  );
}

function SectionHeading({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-(--color-text) sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-text-muted)">
            {description}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="flex min-h-11 items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-4 text-sm font-semibold text-(--color-text) transition-colors hover:border-(--color-accent-text)"
        >
          {label}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div role="status" aria-label="Carregando a vitrine" className="py-12">
      <span className="sr-only">Carregando a vitrine…</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="mb-6 h-7 w-2/3 rounded bg-(--color-surface-2)" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-(--color-surface-2)" />
          ))}
        </div>
      </div>
    </div>
  );
}

function CommunitySkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando profissionais e publicações"
      className="border-t border-(--color-border) py-12"
    >
      <span className="sr-only">Carregando profissionais e publicações…</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="mb-6 h-7 w-3/5 rounded bg-(--color-surface-2)" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-(--color-surface-2)" />
          ))}
        </div>
      </div>
    </div>
  );
}
