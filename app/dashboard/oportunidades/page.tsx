import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ServiceRequestCard } from "@/components/ServiceRequestCard";
import { categories } from "@/lib/data/categories";
import { createPublicClient } from "@/lib/supabase/public";
import { listOpenServiceRequests } from "@/lib/supabase/serviceRequests";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Oportunidades",
  description: "Pedidos publicados por pessoas procurando profissionais no Jobê.",
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <DashboardPageHeader
        eyebrow="Encontre trabalho"
        title="Oportunidades"
        description="Pedidos publicados por pessoas que estão procurando alguém para fazer o trabalho."
      />

      <nav aria-label="Filtrar oportunidades" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <FilterLink href="/dashboard/oportunidades" active={!categoria}>Todas</FilterLink>
        {FEATURED_CATEGORIES.map((slug) => {
          const item = categories.find((candidate) => candidate.slug === slug);
          return item ? (
            <FilterLink key={slug} href={`/dashboard/oportunidades?categoria=${slug}`} active={categoria === slug}>
              {item.name}
            </FilterLink>
          ) : null;
        })}
      </nav>

      {requests.length ? (
        <div className="flex flex-col gap-4">
          {requests.map((request) => <ServiceRequestCard key={request.id} request={request} feed />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
          <EmptyState
            icon={BriefcaseBusiness}
            title="Nada novo nessa categoria agora"
            description="Quando alguém publicar um pedido por aqui, ele aparece nesta lista."
          />
        </div>
      )}
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
        active
          ? "border-(--color-contrast) bg-(--color-contrast) font-medium text-(--color-on-contrast)"
          : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:border-(--color-accent-text)"
      }`}
    >
      {children}
    </Link>
  );
}
