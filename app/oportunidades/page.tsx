import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { ServiceRequestCard } from "@/components/ServiceRequestCard";
import { EmptyState } from "@/components/EmptyState";
import { categories } from "@/lib/data/categories";
import { createPublicClient } from "@/lib/supabase/public";
import { listOpenServiceRequests } from "@/lib/supabase/serviceRequests";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Oportunidades de serviço",
  description: "Veja o que pessoas estão procurando e envie uma proposta pelo Jobê.",
};

const FEATURED_CATEGORIES = ["design", "videos", "programacao", "marketing", "social-media", "redacao-e-copywriting"];

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria = "" } = await searchParams;
  const requests = await listOpenServiceRequests(createPublicClient(), categoria || undefined).catch(() => []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-5 border-b border-(--color-border) pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-(--color-accent-text)">Trabalhos procurando profissionais</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl">
            Encontre um projeto que combina com você
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted) sm:text-base">
            Pessoas publicam o que precisam. Você se apresenta, conversa e envia sua proposta com valor e prazo pelo Jobê.
          </p>
        </div>
        <Link
          href="/oportunidades/nova"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-(--color-accent) px-5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
        >
          <Plus size={17} aria-hidden="true" />
          Publicar o que preciso
        </Link>
      </header>

      <nav aria-label="Filtrar oportunidades" className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto border-b border-(--color-border) px-4 py-3 sm:mx-0 sm:px-0">
        <Link href="/oportunidades" className={`shrink-0 border-b-2 px-1 py-2 text-sm ${!categoria ? "border-(--color-accent-text) font-semibold text-(--color-accent-text)" : "border-transparent text-(--color-text-muted)"}`}>Todas</Link>
        {FEATURED_CATEGORIES.map((slug) => {
          const item = categories.find((candidate) => candidate.slug === slug);
          if (!item) return null;
          const active = categoria === slug;
          return (
            <Link key={slug} href={`/oportunidades?categoria=${slug}`} className={`shrink-0 border-b-2 px-1 py-2 text-sm ${active ? "border-(--color-accent-text) font-semibold text-(--color-accent-text)" : "border-transparent text-(--color-text-muted)"}`}>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {requests.length ? (
        <div className="grid gap-x-5 sm:grid-cols-2">
          {requests.map((request) => <ServiceRequestCard key={request.id} request={request} />)}
        </div>
      ) : (
        <div className="py-14">
          <EmptyState
            icon={BriefcaseBusiness}
            title="Nenhuma oportunidade aqui ainda"
            description={categoria ? "Tente outra categoria ou veja todas as publicações." : "Seja a primeira pessoa a publicar o serviço que está procurando."}
          />
        </div>
      )}
    </div>
  );
}
