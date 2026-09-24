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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-text-subtle)">
              Edição #01
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="font-serif text-4xl font-bold leading-none tracking-tight text-(--color-text) sm:text-5xl">
                {creator.displayName}
              </h1>
              {profile.verificationStatus === "verified" ? <VerifiedBadge size={18} /> : null}
            </div>
            <p className="mt-2 text-sm text-(--color-text-subtle)">@{creator.username}</p>
          </div>

          {isOwnProfile ? null : <ReportMenu bare />}
        </div>

        <div className="grid grid-cols-[1.35fr_0.65fr] gap-3">
          <MediaPlaceholder
            seed={`${creator.id}-magazine`}
            className="h-52 w-full rounded-2xl sm:h-64"
            label={`Destaque de ${creator.displayName}`}
          />
          <div className="grid gap-3">
            <div className="flex flex-col justify-between rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
                Produtos
              </span>
              <strong className="text-3xl font-bold text-(--color-text)">{approved.length}</strong>
            </div>
            <div className="flex flex-col justify-between rounded-2xl bg-(--color-accent) p-4 text-(--color-on-accent)">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
                Avaliação
              </span>
              <strong className="text-3xl font-bold">
                {profile.ratingCount > 0 ? profile.rating.toFixed(1) : "—"}
              </strong>
            </div>
          </div>
        </div>

        {profile.bio ? (
          <blockquote className="max-w-3xl font-serif text-xl font-semibold leading-relaxed text-(--color-text) sm:text-2xl">
            “{profile.bio}”
          </blockquote>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {profile.ratingCount > 0 ? (
            <RatingStars rating={profile.rating} ratingCount={profile.ratingCount} />
          ) : null}
          <span className="text-sm text-(--color-text-muted)">
            {profile.followers.toLocaleString("pt-BR")} seguidores
          </span>
        </div>

        {isOwnProfile ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent) transition-colors hover:bg-(--color-accent-hover)"
            >
              Meu painel
            </Link>
            <Link
              href="/dashboard/configuracoes"
              className="rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-surface-2)"
            >
              Editar meu perfil
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
      </section>

      {offerings.length > 0 || profile.offeringsDescription || isOwnProfile ? (
        <section className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--color-text-subtle)">
              O que entra aqui
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-(--color-text)">
              O que eu faço
            </h2>
          </div>

          {profile.offeringsDescription ? (
            <p className="max-w-2xl text-sm leading-relaxed text-(--color-text-muted)">
              {profile.offeringsDescription}
            </p>
          ) : null}

          {offerings.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {offerings.map((offering) => (
                <article
                  key={offering}
                  className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"
                >
                  <h3 className="font-semibold text-(--color-text)">{offering}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">
                    Me conta o que você precisa e a gente combina o resto pela conversa.
                  </p>
                </article>
              ))}
            </div>
          ) : isOwnProfile ? (
            <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
              <p className="text-sm font-medium text-(--color-text)">Ainda não colocou seus serviços aqui.</p>
              <p className="mt-1 text-xs text-(--color-text-muted)">
                Adicione o que você faz para quem visitar seu perfil entender rapidinho.
              </p>
              <Link
                href="/dashboard/configuracoes"
                className="mt-3 inline-flex text-sm font-medium text-(--color-accent-text) hover:underline"
              >
                Editar serviços
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="-mx-4 bg-(--color-contrast) px-4 py-6 text-(--color-on-contrast) sm:-mx-6 sm:px-6">
        {isOwnProfile ? (
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">Seu perfil</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold">Sua vitrine dentro do Jobê</h2>
            <p className="mt-2 text-sm leading-relaxed opacity-75">
              É aqui que as pessoas veem o que você faz, seus trabalhos e podem chegar com uma ideia.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent)"
            >
              Abrir meu painel
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">Tem uma ideia?</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold">Pode explicar do seu jeito</h2>
            <p className="mt-2 text-sm leading-relaxed opacity-75">
              Não precisa saber o nome do serviço. Conta o que você quer fazer e vocês acertam valor, prazo e detalhes pela conversa.
            </p>
            <div className="mt-4 [&>a]:bg-(--color-accent) [&>a]:text-(--color-on-accent) [&>button]:bg-(--color-accent) [&>button]:text-(--color-on-accent)">
              <CustomOrderForm creator={creator} />
            </div>
          </div>
        )}
      </section>

      <section className="border-b border-(--color-border) pb-7">
        <PortfolioSection
          initialItems={portfolio}
          isOwnProfile={isOwnProfile}
          title="Trabalhos"
        />
      </section>

      <section className="flex flex-col gap-3 border-b border-(--color-border) pb-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--color-text-subtle)">
              Loja
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-(--color-text)">Produtos digitais</h2>
          </div>
          <span className="text-sm text-(--color-text-muted)">
            {approved.length} {approved.length === 1 ? "publicado" : "publicados"}
          </span>
        </div>

        {approved.length === 0 ? (
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-7">
            <p className="text-sm text-(--color-text-muted)">
              {isOwnProfile
                ? "Você ainda não publicou nenhum produto."
                : "Ainda não tem produto publicado por aqui."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {approved.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 border-b border-(--color-border) pb-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--color-text-subtle)">
              O que falaram
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-(--color-text)">Avaliações</h2>
          </div>
          {profile.ratingCount > 0 ? (
            <RatingStars rating={profile.rating} ratingCount={profile.ratingCount} />
          ) : null}
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Ainda não tem avaliação por aqui.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <p className="mt-3 font-serif text-base leading-relaxed text-(--color-text)">
                    “{review.comment}”
                  </p>
                ) : null}
                <time className="mt-3 block text-xs text-(--color-text-subtle)">
                  {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border-b border-(--color-border) pb-7">
        <SkillsSection
          initialSkills={profile.skills ?? []}
          isOwnProfile={isOwnProfile}
          title="Coisas que eu manjo"
        />
      </section>

      <section>
        <ResumeSection
          initialEntries={resumeEntries}
          initialLanguages={profile.languages ?? []}
          isOwnProfile={isOwnProfile}
          title="Formação e idiomas"
        />
      </section>
    </div>
  );
}
