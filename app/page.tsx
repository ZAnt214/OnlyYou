import Link from "next/link";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { ProductCard } from "@/components/ProductCard";
import { CreatorCard } from "@/components/CreatorCard";

export default async function HomePage() {
  const [products, creators] = await Promise.all([
    productRepository.findAll(),
    userRepository.findCreators(),
  ]);

  const approved = products.filter((p) => p.status === "approved");
  const nameById = new Map(creators.map((c) => [c.id, c.displayName]));

  const novidades = [...approved].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8);
  const maisVendidos = [...approved].sort((a, b) => b.salesCount - a.salesCount).slice(0, 8);
  const ofertas = approved.filter((p) => p.promoPrice != null).slice(0, 8);
  const emDestaque = creators
    .filter((c) => c.creatorProfile?.verificationStatus === "verified")
    .slice(0, 6);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-(--color-text)">Descubra novos conteúdos</h1>
        <p className="text-sm text-(--color-text-muted)">
          Escolha o conteúdo que deseja comprar. Publicado por criadores que definem o próprio preço.
        </p>
        <Row>
          {approved.slice(0, 10).map((p) => (
            <ProductCard key={p.id} product={p} creatorName={nameById.get(p.creatorId)} />
          ))}
        </Row>
      </section>

      <Section title="Novidades" href="/descobrir">
        <Row>
          {novidades.map((p) => (
            <ProductCard key={p.id} product={p} creatorName={nameById.get(p.creatorId)} />
          ))}
        </Row>
      </Section>

      <Section title="Mais vendidos" href="/descobrir?sort=vendidos">
        <Row>
          {maisVendidos.map((p) => (
            <ProductCard key={p.id} product={p} creatorName={nameById.get(p.creatorId)} />
          ))}
        </Row>
      </Section>

      <Section title="Criadores em destaque" href="/criadores">
        <Row>
          {emDestaque.map((c) => (
            <div key={c.id} className="w-40">
              <CreatorCard creator={c} />
            </div>
          ))}
        </Row>
      </Section>

      {ofertas.length > 0 ? (
        <Section title="Ofertas" href="/descobrir?ofertas=1">
          <Row>
            {ofertas.map((p) => (
              <ProductCard key={p.id} product={p} creatorName={nameById.get(p.creatorId)} />
            ))}
          </Row>
        </Section>
      ) : null}
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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--color-text)">{title}</h2>
        <Link href={href} className="text-sm text-(--color-text-muted) hover:text-(--color-accent)">
          Ver produtos
        </Link>
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-5 [&>*]:w-40 sm:[&>*]:w-auto">
      {children}
    </div>
  );
}
