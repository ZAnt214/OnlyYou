import { notFound } from "next/navigation";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { categoryRepository } from "@/lib/repositories/CategoryRepository";
import { ProductCard } from "@/components/ProductCard";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await categoryRepository.findBySlug(slug);
  if (!category) notFound();

  const [products, creators] = await Promise.all([
    productRepository.findByCategory(slug),
    userRepository.findCreators(),
  ]);
  const approved = products.filter((p) => p.status === "approved");
  const nameById = new Map(creators.map((c) => [c.id, c.displayName]));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-(--color-text)">{category.name}</h1>
      {approved.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">Nenhum produto publicado ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {approved.map((p) => (
            <ProductCard key={p.id} product={p} creatorName={nameById.get(p.creatorId)} />
          ))}
        </div>
      )}
    </div>
  );
}
