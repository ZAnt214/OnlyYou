import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ServiceRequestCard } from "@/components/ServiceRequestCard";
import { categories } from "@/lib/data/categories";
import { createPublicClient } from "@/lib/supabase/public";
import { listOpenServiceRequests } from "@/lib/supabase/serviceRequests";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Feed de oportunidades",
  description: "Pedidos de serviços e produtos publicados por pessoas procurando profissionais no Jobê.",
};

const FEATURED_CATEGORIES = ["design", "videos", "programacao", "marketing", "social-media", "redacao-e-copywriting"];

export default async function CreatorOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria = "" } = await searchParams;
  const requests = await listOpenServiceRequests(createPublicClient(), categoria || undefined).catch(() => []);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 text-center shadow-sm sm:p-7">
        <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-(--color-accent-soft) px-3 py-1.5 text-xs font-semibold text-(--color-accent-text)">
          <Sparkles size={14} aria-hidden="true" />
          Feed exclusivo para criadores
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-(--color-text)">Pessoas procurando o que você sabe fazer</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-(--color-text-muted)">
          Aqui aparecem somente publicações de quem procura um serviço ou produto. Encontre um pedido que combina com você e abra a conversa.
        </p>
      </header>

      <nav aria-label="Filtrar feed de oportunidades" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
        <FilterLink href="/dashboard/oportunidades" active={!categoria}>Todos</FilterLink>
        {FEATURED_CATEGORIES.map((slug) => {
          const item = categories.find((candidate) => candidate.slug === slug);
          return item ? <FilterLink key={slug} href={`/dashboard/oportunidades?categoria=${slug}`} active={categoria === slug}>{item.name}</FilterLink> : null;
        })}
      </nav>

      {requests.length ? (
        <div className="mt-2 flex flex-col gap-4">
          {requests.map((request) => <ServiceRequestCard key={request.id} request={request} feed />)}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
          <EmptyState
            icon={BriefcaseBusiness}
            title="Nenhum pedido nesta categoria agora"
            description="Novas publicações de serviços e produtos aparecerão aqui assim que forem feitas."
          />
        </div>
      )}
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${active ? "border-transparent bg-(--color-accent-soft) font-semibold text-(--color-accent-text)" : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted)"}`}>
      {children}
    </Link>
  );
}
