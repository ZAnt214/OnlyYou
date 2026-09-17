"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  listCustomRequestsForCreator,
  listCustomRequestsForRequester,
  listProposalsForRequest,
  getCustomServiceOrderByRequest,
} from "@/lib/supabase/customRequests";
import { StatusBadge } from "@/components/StatusBadge";
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
}

/**
 * Lista de pedidos personalizados, reusada tanto no painel do criador
 * (/dashboard/pedidos-personalizados) quanto na área do comprador
 * (/pedidos) — só muda o papel do usuário atuando e a rota de destino do
 * botão "Conversar". Lê direto do Supabase (RLS já restringe às linhas do
 * próprio usuário) — ver lib/supabase/customRequests.ts.
 */
export function CustomRequestsList({
  userId,
  role,
}: {
  userId: string | null;
  role: "creator" | "requester";
}) {
  const [rows, setRows] = useState<RequestRow[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const requests =
        role === "creator"
          ? await listCustomRequestsForCreator(supabase, userId!)
          : await listCustomRequestsForRequester(supabase, userId!);

      const built = await Promise.all(
        requests.map(async (request) => {
          const [proposals, customServiceOrder, counterpart] = await Promise.all([
            listProposalsForRequest(supabase, request.id),
            getCustomServiceOrderByRequest(supabase, request.id),
            supabase
              .from("profiles")
              .select("display_name, username")
              .eq("id", role === "creator" ? request.requesterId : request.creatorId)
              .maybeSingle()
              .then((r) => r.data),
          ]);
          const proposal = proposals.find((p) => p.status === "accepted" || p.status === "sent");
          return {
            request,
            proposal,
            customServiceOrder,
            counterpartName: counterpart?.display_name ?? counterpart?.username ?? "Usuário",
          };
        }),
      );

      if (!cancelled) setRows(built);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, role]);

  const basePath = role === "creator" ? "/dashboard/pedidos-personalizados" : "/pedidos";

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
            : "Pedidos personalizados que você fizer a profissionais aparecem aqui."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ request, proposal, customServiceOrder, counterpartName }) => (
        <Link
          key={request.id}
          href={`${basePath}/${request.id}`}
          className="flex flex-col gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm transition-colors hover:border-(--color-accent) sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-(--color-text)">
                {role === "creator" ? counterpartName : `Pedido para ${counterpartName}`}
              </span>
              <StatusBadge status={request.status} />
            </div>
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
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text) sm:self-auto">
            <MessageSquare size={14} strokeWidth={1.5} />
            Conversar
          </span>
        </Link>
      ))}
    </div>
  );
}
