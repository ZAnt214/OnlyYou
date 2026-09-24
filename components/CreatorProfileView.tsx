import Link from "next/link";
import { Star } from "lucide-react";
import type { CustomOrderReviewWithReviewer, PortfolioItem, Product, ResumeEntry, User } from "@/lib/types";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { RatingStars } from "@/components/RatingStars";
import { ProductCard } from "@/components/ProductCard";
import { ReportMenu } from "@/components/ReportMenu";
import { CustomOrderForm } from "@/components/CustomOrderForm";
import { PortfolioSection } from "@/components/PortfolioSection";
import { SkillsSection } from "@/components/SkillsSection";
import { ResumeSection } from "@/components/ResumeSection";

interface CreatorProfileViewProps {
  creator: User;
  products: Product[];
  reviews?: CustomOrderReviewWithReviewer[];
  portfolio?: PortfolioItem[];
  resumeEntries?: ResumeEntry[];
  isOwnProfile?: boolean;
}

export function CreatorProfileView({
  creator,
  products,
  reviews = [],
  portfolio = [],
  resumeEntries = [],
  isOwnProfile = false,
}: CreatorProfileViewProps) {
  const profile = creator.creatorProfile;
  if (!profile) return null;

  const approved = products.filter((product) => product.status === "approved");
  const offerings = profile.offerings ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-7">
      <section className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <MediaPlaceholder
              seed={creator.id}
              kind="avatar"
              className="h-20 w-20 flex-shrink-0 border-2 border-(--color-border)"
              label={creator.displayName}
              flush
            />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <h1 className="truncate text-2xl font-bold tracking-tight text-(--color-text)">
                  {creator.displayName}
                </h1>
                {profile.verificationStatus === "verified" ? <VerifiedBadge size={18} /> : null}
              </div>
              <p className="mt-0.5 text-sm text-(--color-text-subtle)">@{creator.username}</p>
              {profile.ratingCount > 0 ? (
                <div className="mt-1.5">
                  <RatingStars rating={profile.rating} ratingCount={profile.ratingCount} />
                </div>
              ) : null}
            </div>
          </div>

          {isOwnProfile ? null : <ReportMenu bare />}
        </div>

        {profile.bio ? (
          <p className="max-w-2xl text-sm leading-relaxed text-(--color-text-muted)">{profile.bio}</p>
        ) : null}

        {isOwnProfile ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent) transition-colors hover:bg-(--color-accent-hover)"
            >
              Painel do criador
            </Link>
            <Link
              href="/dashboard/configuracoes"
              className="rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-surface-2)"
            >
              Editar perfil
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <CustomOrderForm creator={creator} />
            <button
              type="button"
              className="rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-surface-2)"
            >
              Seguir
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-3 text-center">
            <strong className="block text-lg font-bold text-(--color-text)">{approved.length}</strong>
            <span className="text-[11px] text-(--color-text-muted)">Produtos</span>
          </div>
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-3 text-center">
            <strong className="block text-lg font-bold text-(--color-text)">
              {profile.ratingCount > 0 ? profile.rating.toFixed(1) : "—"}
            </strong>
            <span className="text-[11px] text-(--color-text-muted)">Avaliação</span>
          </div>
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-3 text-center">
            <strong className="block text-lg font-bold text-(--color-text)">
              {profile.followers.toLocaleString("pt-BR")}
            </strong>
            <span className="text-[11px] text-(--color-text-muted)">Seguidores</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-(--color-accent) p-5 text-(--color-on-accent)">
        {isOwnProfile ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">Sua vitrine profissional</p>
            <h2 className="mt-1 text-xl font-bold">Pedidos personalizados</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed opacity-80">
              É aqui que clientes conhecem seu trabalho e podem iniciar uma conversa para pedir algo sob medida.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex rounded-full bg-(--color-contrast) px-4 py-2.5 text-sm font-semibold text-(--color-on-contrast)"
            >
              Gerenciar no painel
            </Link>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">Trabalho personalizado</p>
            <h2 className="mt-1 text-xl font-bold">Precisa de algo feito sob medida?</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed opacity-80">
              Explique o que você precisa. O criador pode conversar com você e enviar uma proposta com valor e prazo.
            </p>
            <div className="mt-4 [&>a]:bg-(--color-contrast) [&>a]:text-(--color-on-contrast) [&>button]:bg-(--color-contrast) [&>button]:text-(--color-on-contrast)">
              <CustomOrderForm creator={creator} />
            </div>
          </>
        )}
      </section>

      {offerings.length > 0 || profile.offeringsDescription ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-(--color-text-subtle)">
                Serviços
              </p>
              <h2 className="mt-1 text-lg font-bold text-(--color-text)">O que eu faço</h2>
            </div>
            {isOwnProfile ? (
              <Link href="/dashboard/configuracoes" className="text-sm text-(--color-text-muted) hover:text-(--color-text)">
                Editar
              </Link>
            ) : null}
          </div>

          {profile.offeringsDescription ? (
            <p className="max-w-2xl text-sm leading-relaxed text-(--color-text-muted)">
              {profile.offeringsDescription}
            </p>
          ) : null}

          {offerings.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {offerings.map((offering) => (
                <div
                  key={offering}
                  className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"
                >
                  <p className="font-semibold text-(--color-text)">{offering}</p>
                  <p className="mt-1 text-xs text-(--color-text-muted)">
                    Converse com o criador para combinar escopo, prazo e valor.
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-(--color-text-subtle)">
              Loja
            </p>
            <h2 className="mt-1 text-lg font-bold text-(--color-text)">Produtos digitais</h2>
          </div>
          <span className="text-sm text-(--color-text-muted)">
            {approved.length} {approved.length === 1 ? "publicado" : "publicados"}
          </span>
        </div>

        {approved.length === 0 ? (
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-8 text-center">
            <p className="text-sm font-medium text-(--color-text)">Nenhum produto publicado ainda</p>
            {isOwnProfile ? (
              <p className="mt-1 text-xs text-(--color-text-muted)">
                Quando você publicar produtos, eles vão aparecer aqui para quem visitar seu perfil.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {approved.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-(--color-border) pt-6">
        <PortfolioSection initialItems={portfolio} isOwnProfile={isOwnProfile} />
      </section>

      <section className="flex flex-col gap-3 border-t border-(--color-border) pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-(--color-text-subtle)">
              Reputação
            </p>
            <h2 className="mt-1 text-lg font-bold text-(--color-text)">Avaliações</h2>
          </div>
          {profile.ratingCount > 0 ? (
            <RatingStars rating={profile.rating} ratingCount={profile.ratingCount} />
          ) : null}
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Ainda não há avaliações.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-(--color-text)">{review.reviewerName}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        size={14}
                        strokeWidth={1.5}
                        className={value <= review.rating ? "text-(--color-accent-text)" : "text-(--color-border)"}
                        fill={value <= review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">{review.comment}</p>
                ) : null}
                <time className="mt-2 block text-xs text-(--color-text-subtle)">
                  {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-(--color-border) pt-6">
        <SkillsSection initialSkills={profile.skills ?? []} isOwnProfile={isOwnProfile} />
      </section>

      <section className="border-t border-(--color-border) pt-6">
        <ResumeSection
          initialEntries={resumeEntries}
          initialLanguages={profile.languages ?? []}
          isOwnProfile={isOwnProfile}
        />
      </section>
    </div>
  );
}
