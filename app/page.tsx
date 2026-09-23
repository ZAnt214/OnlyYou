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
import { HomeCatalogTabs } from "@/components/HomeCatalogTabs";
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--color-text-muted)">Veio contratar ou mostrar o que sabe fazer?</p>
        <h1 id="home-title" className="mt-3 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          Tem algo em mente?<br />Vamos encontrar quem pode ajudar.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-(--color-text-muted) sm:text-lg">No Jobê, você encontra profissionais, serviços e produtos digitais para tirar sua ideia do papel.</p>
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
      <section id="como-funciona" aria-labelledby="conversation-title" className="-mx-4 scroll-mt-24 bg-(--color-surface-2) px-4 py-10 sm:-mx-6 sm:px-6 sm:py-14 lg:-mx-8 lg:px-8">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Espaço para combinar</p>
            <h2 id="conversation-title" className="mt-3 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Um bom trabalho<br />começa na conversa.</h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-(--color-text-muted)">Fale sobre sua ideia, tire dúvidas e combine os detalhes com quem vai fazer.</p>
          </div>
          <div className="max-w-lg">
            <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.15em] text-(--color-text-muted)">Uma conversa pode começar assim</p>
            <p className="max-w-[88%] rounded-2xl rounded-bl-sm border border-(--color-border) bg-(--color-bg) px-5 py-4 text-sm leading-relaxed">Quero uma identidade para minha marca. Podemos conversar sobre o estilo?</p>
            <p className="ml-auto mt-4 max-w-[88%] rounded-2xl rounded-br-sm bg-(--color-contrast) px-5 py-4 text-sm leading-relaxed text-(--color-on-contrast)">Claro! Me conta sobre a marca e o que você tem em mente.</p>
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-(--color-border) pt-5 text-xs text-(--color-text-muted)"><p><strong className="font-semibold text-(--color-text)">Escopo, valor e prazo.</strong><br />Combinados antes de fechar.</p><ArrowUpRight size={22} aria-hidden="true" /></div>
          </div>
        </div>
      </section>
      <Suspense fallback={<CommunitySkeleton />}>
        <Community />
      </Suspense>
      <section
        id="duvidas"
        className="grid scroll-mt-24 gap-6 border-t border-(--color-border) py-10 sm:py-14 md:grid-cols-[0.85fr_1.4fr] md:gap-16"
      >
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Antes de começar</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Vamos tirar<br />suas dúvidas.</h2></div>
        <div>
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
        </div>
      </section>
      <section className="-mx-4 flex flex-col items-start justify-between gap-6 bg-(--color-accent) px-4 py-9 text-(--color-on-accent) sm:-mx-6 sm:flex-row sm:items-center sm:px-6 lg:-mx-8 lg:px-8">
        <h2 className="text-3xl font-bold leading-tight tracking-tight">O próximo projeto<br />pode começar aqui.</h2>
        <Link href="/descobrir" className="inline-flex min-h-12 items-center gap-4 rounded-lg bg-(--color-contrast) px-5 py-3 text-sm font-semibold text-(--color-on-contrast) hover:opacity-90">Encontrar um profissional <ArrowUpRight size={18} aria-hidden="true" /></Link>
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
    <section id="oportunidades" className="grid scroll-mt-24 gap-8 border-t border-(--color-border) py-10 sm:py-14 md:grid-cols-[1fr_1.15fr] md:gap-16">
      <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Outro jeito de encontrar</p><h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Conte o que precisa.<br />Abra a conversa.</h2><p className="mb-6 mt-5 max-w-sm text-sm leading-relaxed text-(--color-text-muted)">Publique seu pedido para que profissionais interessados possam responder e enviar propostas.</p><Link href="/oportunidades/nova" className="inline-flex min-h-12 items-center gap-6 rounded-lg bg-(--color-accent) px-5 py-3 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)">Publicar meu pedido <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
      <div className="border-t-2 border-(--color-text)">
        <div className="divide-y divide-(--color-border)">{requests.length ? requests.map((request) => <OpportunityPreview key={request.id} request={request} />) : <div className="py-6"><h3 className="font-semibold">O primeiro pedido pode ser o seu.</h3><p className="mt-2 text-sm text-(--color-text-muted)">Conte o que procura e receba respostas de profissionais.</p></div>}</div>
        <Link href="/oportunidades" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">Ver todos os pedidos <ArrowUpRight size={16} aria-hidden="true" /></Link>
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
        title="Boas ideias. Gente que faz."
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
      <HomeCatalogTabs
        services={<div className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-3">{gigs.filter(gig => gig.category !== "play_together").slice(0, 6).map(gig => <GigCard key={gig.id} gig={gig} creatorName={creatorById.get(gig.creatorId)?.displayName} marketplace />)}</div>}
        products={<div className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-3">{approved.slice(0, 6).map(product => <ProductCard key={product.id} product={product} creatorName={creatorById.get(product.creatorId)?.displayName} marketplace />)}</div>}
        gaming={<div className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-3">{gigs.filter(gig => gig.category === "play_together").slice(0, 6).map(gig => <GigCard key={gig.id} gig={gig} creatorName={creatorById.get(gig.creatorId)?.displayName} marketplace />)}</div>}
        counts={[gigs.filter(gig => gig.category !== "play_together").length, approved.length, gigs.filter(gig => gig.category === "play_together").length]}
        unavailable={unavailable}
      />
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
      <div className="grid items-center gap-8 md:grid-cols-[1.25fr_1fr] md:gap-16">
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Para quem cria</p><h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Seu talento merece<br />um lugar na vitrine.</h2><p className="mt-5 max-w-md text-sm leading-relaxed text-(--color-text-muted)">Monte seu perfil, publique seus serviços e encontre pedidos que combinam com o que você faz.</p><Link href="/dashboard" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">Quero ser criador <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        <div className="rounded-xl bg-(--color-contrast) p-6 text-(--color-on-contrast)"><h3 className="mb-5 text-lg font-semibold">Conheça quem já está por aqui</h3>{featuredCreators.length ? <div className="space-y-3">{featuredCreators.map(creator => <CreatorCard key={creator.id} creator={creator} compactHome />)}</div> : <p className="text-sm">Seu próximo projeto pode colocar seu trabalho em destaque.</p>}<Link href="/criadores" className="mt-5 flex min-h-11 items-center justify-between gap-4 border-t border-current pt-4 text-sm font-semibold">Conhecer profissionais <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
      </div>
      {feed.length ? (
        <details className="mt-9 border-t border-(--color-border) pt-5"><summary className="cursor-pointer py-3 text-sm font-semibold">Publicações recentes da comunidade</summary>
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
        </details>
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
