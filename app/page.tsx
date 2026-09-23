import Link from "next/link";
import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { ArrowUpRight, Search } from "lucide-react";
import type { Gig, Product, ServiceRequest, User } from "@/lib/types";
import { createPublicClient } from "@/lib/supabase/public";
import { listActiveGigs } from "@/lib/supabase/gigs";
import { listApprovedProducts } from "@/lib/supabase/products";
import { listUsersByIds } from "@/lib/supabase/profile";
import { listOpenServiceRequests } from "@/lib/supabase/serviceRequests";
import { ProductCard } from "@/components/ProductCard";
import { GigCard } from "@/components/GigCard";
import { CreatorCard } from "@/components/CreatorCard";
import { FeedPostCard } from "@/components/FeedPostCard";
import { GigFeedCard } from "@/components/GigFeedCard";
import { EmptyState } from "@/components/EmptyState";

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
      <section aria-labelledby="home-title" className="pb-6 pt-8 sm:pb-8 sm:pt-12">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-(--color-text-muted)">Serviços e produtos digitais</p>
        <h1 id="home-title" className="mt-3 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          Sua ideia merece<br />quem sabe fazer.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-(--color-text-muted) sm:text-lg">Encontre profissionais ou publique o que precisa.</p>
        <form action="/descobrir" role="search" aria-label="Buscar no Jobê" className="mt-6 flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) p-1.5 pl-4 focus-within:outline-2 focus-within:outline-(--color-accent-text)">
          <Search size={20} aria-hidden="true" className="hidden shrink-0 text-(--color-text-muted) sm:block" />
          <label htmlFor="home-search" className="sr-only">O que você está procurando?</label>
          <input id="home-search" name="q" type="search" maxLength={160} placeholder="O que você está procurando?" className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-(--color-text-muted)" />
          <button type="submit" aria-label="Buscar" className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-lg bg-(--color-accent) text-(--color-on-accent) hover:bg-(--color-accent-hover)">
            <Search size={22} aria-hidden="true" />
          </button>
        </form>
        <nav aria-label="Categorias de serviços" className="mt-4 flex flex-wrap gap-2">
          {categories.map(([slug, name]) => (
            <Link key={slug} href={"/categorias/" + slug} className="inline-flex min-h-11 items-center rounded-full bg-(--color-surface-2) px-4 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-accent) hover:text-(--color-on-accent)">{name}</Link>
          ))}
        </nav>
      </section>
      <section aria-labelledby="publish-title" className="flex flex-col items-start justify-between gap-4 rounded-xl bg-(--color-accent) p-5 text-(--color-on-accent) sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 id="publish-title" className="text-xl font-bold tracking-tight sm:text-2xl">Prefere receber propostas?</h2>
          <p className="mt-1 text-sm leading-relaxed sm:text-base">Publique seu pedido e converse com profissionais.</p>
        </div>
        <Link href="/oportunidades/nova" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-(--color-contrast) px-5 text-sm font-semibold text-(--color-on-contrast) hover:opacity-90">
          Publicar pedido <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <Suspense fallback={<CatalogSkeleton />}>
        <Vitrine />
      </Suspense>
      <Suspense fallback={<OpportunitySpotlightSkeleton />}>
        <OpportunitySpotlight />
      </Suspense>
      <Suspense fallback={<CommunitySkeleton />}>
        <Community />
      </Suspense>
      <section
        id="como-funciona"
        className="scroll-mt-24 border-t border-(--color-border) py-10 sm:py-14"
      >
        <SectionHeading
          title="Como funciona"
          description="Encontre, converse e combine os detalhes do seu projeto."
        />
        <ol className="mt-6 grid gap-0 border-t border-(--color-border) md:grid-cols-3 md:divide-x md:divide-(--color-border)">
          {[
            [
              "Encontre quem faz",
              "Explore serviços, veja os perfis e compare o que cada profissional oferece.",
            ],
            [
              "Converse antes de fechar",
              "Conte o que precisa e combine escopo, valor e prazo na conversa.",
            ],
            [
              "Acompanhe seu pedido",
              "Veja as mensagens e a entrega no Jobê e avalie o resultado.",
            ],
          ].map(([title, text], i) => (
            <li key={title} className="border-b border-(--color-border) py-5 md:border-b-0 md:px-6 md:py-6 md:first:pl-0 md:last:pr-0">
              <span className="text-sm font-bold tabular-nums text-(--color-accent-text)">
                0{i + 1}
              </span>
              <h3 className="mb-2 mt-3 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="max-w-sm text-sm leading-relaxed text-(--color-text-muted)">
                {text}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href="/seguranca"
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-(--color-accent-text) underline underline-offset-4"
        >
          Conheça os cuidados e as regras do Jobê{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
      <section className="flex flex-col items-start justify-between gap-6 border-y border-(--color-border) py-9 sm:flex-row sm:items-center sm:py-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent-text)">Para profissionais</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">
            Mostre o que você faz.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-(--color-text-muted)">
            Crie seu perfil, publique serviços ou produtos digitais e converse com quem procura seu trabalho.
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-xl bg-(--color-accent) px-5 py-3 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
          >
            Quero oferecer meu trabalho{" "}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section
        id="duvidas"
        className="mx-auto max-w-3xl scroll-mt-24 py-10 sm:py-14"
      >
        <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">Dúvidas frequentes</h2>
        {questions.map(([question, answer]) => (
          <details
            key={question}
            className="group border-b border-(--color-border)"
          >
            <summary className="cursor-pointer py-5 pr-4 text-base font-semibold text-(--color-text) marker:text-(--color-accent-text)">
              {question}
            </summary>
            <p className="max-w-2xl pb-5 text-sm leading-relaxed text-(--color-text-muted)">
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

const getLatestOpportunities = cache(async function getLatestOpportunities() {
  return listOpenServiceRequests(createPublicClient()).catch(() => [] as ServiceRequest[]);
});

async function OpportunitySpotlight() {
  const requests = (await getLatestOpportunities()).slice(0, 3);

  return (
    <section id="oportunidades" className="scroll-mt-24 border-t border-(--color-border) py-9 sm:py-12">
      <SectionHeading title="Pedidos publicados" href="/oportunidades" label="Ver todos" />
      <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">Pessoas que procuram um serviço ou produto. Veja o que elas precisam.</p>
      <div className="mt-5 divide-y divide-(--color-border) border-t border-(--color-border)">
        {requests.length ? requests.map((request) => (
          <OpportunityPreview key={request.id} request={request} />
        )) : (
          <div className="py-6">
            <p className="font-semibold">O primeiro pedido pode ser o seu.</p>
            <p className="mt-2 text-sm text-(--color-text-muted)">Conte o que procura e receba respostas de profissionais.</p>
            <Link href="/oportunidades/nova" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Publicar pedido</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function OpportunityPreview({ request }: { request: ServiceRequest }) {
  return (
    <Link href="/oportunidades" className="group flex min-h-24 items-center justify-between gap-4 py-4">
      <span className="min-w-0">
        <span className="block text-xs text-(--color-text-muted)">Pedido aberto</span>
        <span className="mt-1 block line-clamp-2 text-base font-semibold text-(--color-text) group-hover:text-(--color-accent-text)">{request.title}</span>
        <span className="mt-1 block text-sm text-(--color-text-muted)">
          {request.budgetCents ? `Orçamento de até ${(request.budgetCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Orçamento a combinar"}
        </span>
      </span>
      <ArrowUpRight size={20} aria-hidden="true" className="shrink-0 text-(--color-text-muted) group-hover:text-(--color-accent-text)" />
    </Link>
  );
}

function OpportunitySpotlightSkeleton() {
  return <div role="status" className="my-9 space-y-4 border-t border-(--color-border) py-6" aria-label="Carregando pedidos publicados"><div className="h-6 w-1/2 animate-pulse rounded bg-(--color-surface-2)" /><div className="h-20 animate-pulse rounded bg-(--color-surface-2)" /></div>;
}

async function Vitrine() {
  const { approved, gigs, unavailable, creatorById, offers, feed } =
    await getHomeData();

  return (
    <section id="vitrine" className="scroll-mt-24 py-9 sm:py-12">
      <SectionHeading
        title="Encontre quem faz"
        href="/descobrir"
        label="Ver todos"
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
        <div className="mt-7">
          <h3 className="mb-4 text-lg font-semibold tracking-tight">
            Serviços em destaque
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {gigs.slice(0, 4).map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                creatorName={creatorById.get(gig.creatorId)?.displayName}
                marketplace
              />
            ))}
          </div>
        </div>
      ) : null}
      {approved.length ? (
        <div className="mt-9">
          <h3 className="mb-4 text-lg font-semibold tracking-tight">
            Produtos digitais
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
        <div className="mt-9 border-t border-(--color-border) pt-8">
          <SectionHeading
            title="Ofertas"
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
      {feed.length ? (
        <Link href="/descobrir" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-(--color-accent-text) underline underline-offset-4">
          Ver mais serviços e produtos <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}

async function Community() {
  const { unavailable, creators, creatorById, feed } = await getHomeData();
  const featuredCreators = creators.filter((creator) => creator.creatorProfile).slice(0, 4);

  return (
    <section
      id="comunidade"
      className="scroll-mt-24 border-t border-(--color-border) py-9 sm:py-12"
    >
      <SectionHeading
        title="Conheça os profissionais"
        description="Veja o perfil de quem publica serviços e produtos no Jobê."
        href="/criadores"
        label="Ver todos"
      />
      {featuredCreators.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {featuredCreators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} compactHome />
          ))}
        </div>
      ) : null}
      {feed.length ? (
        <div className="mt-9 border-t border-(--color-border) pt-7">
          <h3 className="mb-4 text-lg font-semibold tracking-tight">
            Publicações recentes
          </h3>
          <div className="max-w-2xl">
            <FeedItemCard item={feed[0]} creator={creatorById.get(feed[0].data.creatorId)} />
          </div>
          {feed.length > 1 ? (
            <details className="mt-3 max-w-2xl">
              <summary className="cursor-pointer py-3 text-sm font-semibold text-(--color-accent-text) underline underline-offset-4">
                Ver mais publicações
              </summary>
              <div className="mt-4 flex flex-col gap-4">
                {feed.slice(1, 12).map((item) => (
                  <FeedItemCard
                    key={item.kind + item.data.id}
                    item={item}
                    creator={creatorById.get(item.data.creatorId)}
                  />
                ))}
              </div>
            </details>
          ) : null}
        </div>
      ) : !featuredCreators.length ? (
        <p className="mt-6 text-sm text-(--color-text-muted)">
          {unavailable
            ? "Os perfis e as publicações voltarão a aparecer quando a conexão for restabelecida."
            : "Os próximos perfis e publicações aparecerão aqui."}
        </p>
      ) : null}
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
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">
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
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-(--color-accent-text) underline underline-offset-4 hover:text-(--color-text)"
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
