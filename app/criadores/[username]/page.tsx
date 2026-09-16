import { notFound } from "next/navigation";
import { userRepository } from "@/lib/repositories/UserRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { RatingStars } from "@/components/RatingStars";
import { ProductCard } from "@/components/ProductCard";
import { ReportMenu } from "@/components/ReportMenu";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const creator = await userRepository.findByUsername(username);
  if (!creator || !creator.creatorProfile) notFound();

  const products = await productRepository.findByCreator(creator.id);
  const approved = products.filter((p) => p.status === "approved");
  const profile = creator.creatorProfile;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <MediaPlaceholder seed={creator.id} kind="avatar" className="h-20 w-20" label={creator.displayName} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-semibold text-(--color-text)">{creator.displayName}</h1>
              {profile.verificationStatus === "verified" ? <VerifiedBadge /> : null}
            </div>
            <span className="text-sm text-(--color-text-subtle)">@{creator.username}</span>
            <RatingStars rating={profile.rating} ratingCount={profile.ratingCount} />
          </div>
        </div>
        <ReportMenu />
      </div>

      <p className="max-w-2xl text-sm text-(--color-text-muted)">{profile.bio}</p>

      <div className="flex items-center gap-6 border-y border-(--color-border) py-3 text-sm text-(--color-text-muted)">
        <span>
          <strong className="text-(--color-text)">{profile.followers.toLocaleString("pt-BR")}</strong>{" "}
          seguidores
        </span>
        <span>
          <strong className="text-(--color-text)">{profile.productCount}</strong> produtos
        </span>
        <button
          type="button"
          className="ml-auto rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          Seguir
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-(--color-text)">Produtos</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Nenhum produto publicado ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {approved.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
