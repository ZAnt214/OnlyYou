"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  listCustomRequestsForCreator,
  listCustomRequestsForRequester,
  listProposalsForRequest,
  getCustomServiceOrderByRequest,
} from "@/lib/supabase/customRequests";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { EmptyState } from "@/components/EmptyState";
import type { CustomRequest, CustomProposal, CustomServiceOrder } from "@/lib/types";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface RequestRow {
  request: CustomRequest;
  proposal: CustomProposal | undefined;
  customServiceOrder: CustomServiceOrder | null;
  counterpartName: string;
  counterpartRating: number;
  counterpartRatingCount: number;
  /** Papel do usuário atuando NESTE pedido específico — necessário quando
   * `role="all"` mescla pedidos enviados e recebidos na mesma lista, já que
   * a mesma conta pode ser criadora em um pedido e compradora em outro. */
  myRole: "creator" | "requester";
}

/**
 * Lista de pedidos personalizados, reusada no painel do criador
 * (/dashboard/pedidos-personalizados, role="creator"), na área geral de
 * mensagens (/pedidos, role="all") e, no futuro, em qualquer filtro
 * exclusivo de "pedidos que eu fiz" (role="requester"). `role="all"` busca
 * os dois lados e mescla — necessário porque a mesma conta pode ser
 * criadora e compradora ao mesmo tempo (ver caso @noisyboy). Lê direto do
 * Supabase (RLS já restringe às linhas do próprio usuário) — ver
 * lib/supabase/customRequests.ts.
 */
export function CustomRequestsList({
  userId,
  role,
}: {
  userId: string | null;
  role: "creator" | "requester" | "all";
}) {
  const [rows, setRows] = useState<RequestRow[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();

    async function buildRows(requests: CustomRequest[]) {
      return Promise.all(
        requests.map(async (request) => {
          const myRole: "creator" | "requester" = request.creatorId === userId ? "creator" : "requester";
          const counterpartId = myRole === "creator" ? request.requesterId : request.creatorId;
          const [proposals, customServiceOrder, counterpart] = await Promise.all([
            listProposalsForRequest(supabase, request.id),
            getCustomServiceOrderByRequest(supabase, request.id),
            supabase
              .from("profiles")
              .select("display_name, username, rating, rating_count")
              .eq("id", counterpartId)
              .maybeSingle()
              .then((r) => r.data),
          ]);
          const proposal = proposals.find((p) => p.status === "accepted" || p.status === "sent");
          return {
            request,
            proposal,
            customServiceOrder,
            counterpartName: counterpart?.display_name ?? counterpart?.username ?? "Usuário",
            counterpartRating: counterpart?.rating ?? 0,
            counterpartRatingCount: counterpart?.rating_count ?? 0,
            myRole,
          };
        }),
      );
    }

    async function load() {
      const requests =
        role === "creator"
          ? await listCustomRequestsForCreator(supabase, userId!)
          : role === "requester"
            ? await listCustomRequestsForRequester(supabase, userId!)
            : [
                ...(await listCustomRequestsForCreator(supabase, userId!)),
                ...(await listCustomRequestsForRequester(supabase, userId!)),
              ].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

      const built = await buildRows(requests);
      if (!cancelled) setRows(built);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, role]);

  if (!userId) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Entre na sua conta"
        description="Faça login para ver suas mensagens e pedidos personalizados."
        action={
          <Link
            href="/entrar"
            className="rounded-(--radius-pill) bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
          >
            Entrar
          </Link>
        }
      />
    );
  }

  if (rows === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-(--color-text-muted)">
        <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
        Carregando…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Nenhuma mensagem ainda"
        description={
          role === "creator"
            ? "Pedidos personalizados recebidos de clientes aparecem aqui."
            : role === "requester"
              ? "Pedidos personalizados que você fizer a profissionais aparecem aqui."
              : "Pedidos personalizados que você fizer ou receber aparecem aqui."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map(
        ({
          request,
          proposal,
          customServiceOrder,
          counterpartName,
          counterpartRating,
          counterpartRatingCount,
          myRole,
        }) => (
        <Link
          key={request.id}
          href={`${myRole === "creator" ? "/dashboard/pedidos-personalizados" : "/pedidos"}/${request.id}`}
          className="flex flex-col gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm transition-colors hover:border-(--color-accent) sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-(--color-text)">
                {myRole === "creator" ? counterpartName : `Pedido para ${counterpartName}`}
              </span>
              <StatusBadge status={request.status} />
            </div>
            <RatingStars rating={counterpartRating} ratingCount={counterpartRatingCount} size={12} />
            <p className="truncate text-sm text-(--color-text-muted)">
              {proposal?.serviceType || request.description}
            </p>
            <p className="text-xs text-(--color-text-subtle)">
              {new Date(request.createdAt).toLocaleDateString("pt-BR")}
              {proposal ? ` · ${formatBRLFromCents(proposal.priceCents)}` : ""}
              {customServiceOrder
                ? ` · prazo ${new Date(customServiceOrder.deliveryDeadlineAt).toLocaleDateString("pt-BR")}`
                : ""}
            </p>
          </div>
          <ChevronRight
            size={18}
            strokeWidth={1.5}
            className="hidden shrink-0 self-center text-(--color-text-subtle) sm:block"
          />
        </Link>
        ),
      )}
    </div>
  );
}
