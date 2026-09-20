import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Gig, Product, User } from "@/lib/types";
import { userRepository } from "@/lib/repositories/UserRepository";
import { createPublicClient } from "@/lib/supabase/public";
import { listActiveGigs } from "@/lib/supabase/gigs";
import { listApprovedProducts } from "@/lib/supabase/products";
import { listUsersByIds } from "@/lib/supabase/profile";
import { ProductCard } from "@/components/ProductCard";
import { FeedPostCard } from "@/components/FeedPostCard";
import { GigFeedCard } from "@/components/GigFeedCard";
import { TopCreatorCard } from "@/components/TopCreatorCard";
import { BecomeCreatorBanner } from "@/components/BecomeCreatorBanner";

// Revalida a cada minuto: gigs são conteúdo real publicado por criadores,
// então a home não pode ficar 100% estática (precisa refletir anúncios
// novos), mas também não precisa virar uma função serverless em toda
// visita — ISR serve do cache na maior parte do tempo e regenera em
// segundo plano.
export const revalidate = 60;

export default async function HomePage() {
  const supabase = createPublicClient();
  const [approved, creators, gigs] = await Promise.all([
    listApprovedProducts(supabase),
    userRepository.findCreators(),
    // Um problema pontual no Supabase nunca pode derrubar a home inteira
    // (nem travar o build/ISR) por causa de uma seção que é só um extra —
    // degrada pra "sem gigs no momento" em vez de propagar o erro.
    listActiveGigs(supabase, { limit: 12 }).catch(() => [] as Gig[]),
  ]);
  const creatorById = new Map(creators.map((c) => [c.id, c]));

  // Gigs são de contas reais (Supabase) — seus criadores não estão na
  // lista mock de `userRepository.findCreators()`, então precisam ser
  // buscados à parte pra o cabeçalho do card (nome, avatar, verificado).
  const gigCreators = await listUsersByIds(
    supabase,
    [...new Set(gigs.map((g) => g.creatorId))],
  ).catch(() => [] as User[]);
  gigCreators.forEach((c) => creatorById.set(c.id, c));

  type FeedItem = { kind: "product"; data: Product } | { kind: "gig"; data: Gig };
  const feed: FeedItem[] = [
    ...approved.map((data): FeedItem => ({ kind: "product", data })),
    ...gigs.map((data): FeedItem => ({ kind: "gig", data })),
  ].sort((a, b) => (a.data.createdAt < b.data.createdAt ? 1 : -1));
  const maisVendidos = [...approved].sort((a, b) => b.salesCount - a.salesCount).slice(0, 6);
  const ofertas = approved.filter((p) => p.promoPrice != null).slice(0, 6);
  const topCreators = [...creators]
    .sort((a, b) => (b.creatorProfile?.followers ?? 0) - (a.creatorProfile?.followers ?? 0))
    .slice(0, 6);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Encontre quem faz</h1>
        <p className="text-sm text-(--color-text-muted)">
          Produtos digitais e serviços publicados por profissionais que definem o próprio preço.
          Não achou pronto? Peça um trabalho personalizado direto com quem faz.
        </p>
      </div>

      <BecomeCreatorBanner href="/dashboard" />

      {feed.slice(0, 2).map((item) => (
        <FeedItemCard key={item.data.id} item={item} creatorById={creatorById} />
      ))}

      <Section title="Top Creators" href="/criadores">
        <Row>
          {topCreators.map((c, i) => (
            <TopCreatorCard key={c.id} creator={c} rank={i + 1} />
          ))}
        </Row>
      </Section>

      {feed.slice(2, 6).map((item) => (
        <FeedItemCard key={item.data.id} item={item} creatorById={creatorById} />
      ))}

      <Section title="Mais vendidos" href="/descobrir?sort=vendidos">
        <Row>
          {maisVendidos.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              creatorName={creatorById.get(p.creatorId)?.displayName}
            />
          ))}
        </Row>
      </Section>

      {ofertas.length > 0 ? (
        <Section title="Ofertas" href="/descobrir?ofertas=1">
          <Row>
            {ofertas.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                creatorName={creatorById.get(p.creatorId)?.displayName}
              />
            ))}
          </Row>
        </Section>
      ) : null}

      {feed.slice(6).map((item) => (
        <FeedItemCard key={item.data.id} item={item} creatorById={creatorById} />
      ))}
    </div>
  );
}

function FeedItemCard({
  item,
  creatorById,
}: {
  item: { kind: "product"; data: Product } | { kind: "gig"; data: Gig };
  creatorById: Map<string, User>;
}) {
  if (item.kind === "gig") {
    return <GigFeedCard gig={item.data} creator={creatorById.get(item.data.creatorId)} />;
  }
  return <FeedPostCard product={item.data} creator={creatorById.get(item.data.creatorId)} />;
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 py-2">
      <Link href={href} className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-(--color-text)">{title}</h2>
        <ChevronRight size={20} strokeWidth={2} className="text-(--color-text-muted)" />
      </Link>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [&>*]:w-44 [&>*]:shrink-0 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:[&>*]:w-auto">
      {children}
    </div>
  );
}
