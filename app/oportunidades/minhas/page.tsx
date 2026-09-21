import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ServiceRequestCard } from "@/components/ServiceRequestCard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/supabase/session";
import { listServiceRequestsForRequester } from "@/lib/supabase/serviceRequests";

export const metadata: Metadata = { title: "Minhas oportunidades" };

export default async function MyOpportunitiesPage() {
  const userId = await getCurrentUserId();
  const requests = userId
    ? await listServiceRequestsForRequester(await createClient(), userId).catch(() => [])
    : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 sm:py-10">
      <header className="flex items-end justify-between gap-4 border-b border-(--color-border) pb-6">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text)">Minhas publicações</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">Acompanhe e encerre os serviços que você publicou.</p>
        </div>
        <Link href="/oportunidades/nova" className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-(--color-accent) px-4 text-sm font-semibold text-(--color-on-accent)">
          <Plus size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Nova publicação</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </header>

      {!userId ? (
        <div className="py-12 text-center">
          <p className="text-sm text-(--color-text-muted)">Entre na sua conta para ver suas publicações.</p>
          <Link href="/entrar" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-(--color-accent) px-5 text-sm font-semibold text-(--color-on-accent)">Entrar</Link>
        </div>
      ) : requests.length ? (
        <div className="grid gap-x-5 sm:grid-cols-2">
          {requests.map((request) => <ServiceRequestCard key={request.id} request={request} />)}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="font-semibold text-(--color-text)">Você ainda não publicou nenhum serviço.</p>
          <p className="mt-1 text-sm text-(--color-text-muted)">Conte o que precisa e deixe os profissionais chegarem até você.</p>
        </div>
      )}
    </div>
  );
}
