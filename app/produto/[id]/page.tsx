import { notFound } from "next/navigation";
import Link from "next/link";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { reviewRepository } from "@/lib/repositories/ReviewRepository";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { RatingStars } from "@/components/RatingStars";
import { StatusBadge } from "@/components/StatusBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ProductReportMenu } from "@/components/ProductReportMenu";
import { ProductCard } from "@/components/ProductCard";
import { ProductPurchaseArea } from "@/components/ProductPurchaseArea";
import { FavoriteButton } from "@/components/FavoriteButton";

/**
 * Todo dado desta página vem de repositório mock (arrays compilados no
 * bundle — produto, criador e avaliações), então não há o que buscar por
 * request: pré-renderizar deixa cada /produto/[id] servir da CDN em vez de
 * acordar uma função serverless. Isso importa porque a home e as listagens
 * têm vários links de produto, e o Next faz prefetch de todos eles — nos
 * logs da Vercel era uma invocação serverless por produto visível na tela.
 */
export async function generateStaticParams() {
  const products = await productRepository.findAll();
  return products.map((product) => ({ id: product.id }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await productRepository.findById(id);
  if (!product) notFound();

  const [creator, related, moreFromCreator, productReviews] = await Promise.all([
    userRepository.findById(product.creatorId),
    productRepository.findByCategory(product.category),
    productRepository.findByCreator(product.creatorId),
    reviewRepository.findByProduct(product.id),
  ]);

  const relatedProducts = related.filter((p) => p.id !== product.id && p.status === "approved").slice(0, 4);
  const others = moreFromCreator.filter((p) => p.id !== product.id && p.status === "approved").slice(0, 4);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <MediaPlaceholder
            seed={product.id}
            kind={product.type === "video" ? "video" : "image"}
            className="aspect-[4/3] w-full"
            label={product.title}
          />
          <div className="grid grid-cols-4 gap-2">
            {product.previewImages.map((img) => (
              <MediaPlaceholder key={img} seed={img} className="aspect-square w-full" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold text-(--color-text)">{product.title}</h1>
              {creator ? (
                <Link
                  href={`/criadores/${creator.username}`}
                  className="flex items-center gap-1 text-sm text-(--color-text-muted) hover:text-(--color-accent)"
                >
                  {creator.displayName}
                  {creator.creatorProfile?.verificationStatus === "verified" ? <VerifiedBadge size={12} /> : null}
                </Link>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton productId={product.id} />
              <ProductReportMenu productId={product.id} />
            </div>
          </div>

          <RatingStars rating={product.rating} ratingCount={product.ratingCount} />

          <ProductPurchaseArea product={product} />

          <div className="flex flex-col gap-2 border-t border-(--color-border) pt-4">
            <h2 className="text-sm font-medium text-(--color-text)">Descrição</h2>
            <p className="text-sm text-(--color-text-muted)">{product.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-(--color-border) pt-4 text-xs text-(--color-text-subtle)">
            <StatusBadge status={product.status} />
            <span className="rounded-md bg-(--color-surface-2) px-2 py-0.5">{product.salesCount} vendas</span>
            {product.tags.map((t) => (
              <span key={t} className="rounded-md bg-(--color-surface-2) px-2 py-0.5">
                #{t}
              </span>
            ))}
          </div>

          <div className="border-t border-(--color-border) pt-4 text-xs text-(--color-text-subtle)">
            Ao comprar, você concorda com os{" "}
            <Link href="/termos" className="underline hover:text-(--color-accent)">
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/conteudo" className="underline hover:text-(--color-accent)">
              política de conteúdo
            </Link>{" "}
            do Jobê.
          </div>
        </div>
      </div>

      {productReviews.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-(--color-text)">Avaliações</h2>
          <div className="flex flex-col divide-y divide-(--color-border) rounded-lg border border-(--color-border)">
            {productReviews.map((r) => (
              <div key={r.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-center gap-2">
                  <RatingStars rating={r.rating} ratingCount={1} size={12} />
                  {r.verifiedPurchase ? (
                    <span className="text-xs text-(--color-text-subtle)">Compra verificada</span>
                  ) : null}
                </div>
                <p className="text-sm text-(--color-text-muted)">{r.comment}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-(--color-text)">Produtos relacionados</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {others.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-(--color-text)">
            Mais de {creator?.displayName ?? "este criador"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {others.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
