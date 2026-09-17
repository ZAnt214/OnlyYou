import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { ProductCard } from "@/components/ProductCard";
import { FeedPostCard } from "@/components/FeedPostCard";
import { TopCreatorCard } from "@/components/TopCreatorCard";
import { BecomeCreatorBanner } from "@/components/BecomeCreatorBanner";

export default async function HomePage() {
  const [products, creators] = await Promise.all([
    productRepository.findAll(),
    userRepository.findCreators(),
  ]);

  const approved = products.filter((p) => p.status === "approved");
  const creatorById = new Map(creators.map((c) => [c.id, c]));

  const feed = [...approved].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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

      {feed.slice(0, 2).map((p) => (
        <FeedPostCard key={p.id} product={p} creator={creatorById.get(p.creatorId)} />
      ))}

      <Section title="Top Creators" href="/criadores">
        <Row>
          {topCreators.map((c, i) => (
            <TopCreatorCard key={c.id} creator={c} rank={i + 1} />
          ))}
        </Row>
      </Section>

      {feed.slice(2, 6).map((p) => (
        <FeedPostCard key={p.id} product={p} creator={creatorById.get(p.creatorId)} />
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

      {feed.slice(6).map((p) => (
        <FeedPostCard key={p.id} product={p} creator={creatorById.get(p.creatorId)} />
      ))}
    </div>
  );
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
