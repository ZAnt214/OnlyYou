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
import { RatingStars } from "@/components/RatingStars";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { EmptyState } from "@/components/EmptyState";
import type { CustomRequest, CustomProposal, CustomServiceOrder } from "@/lib/types";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface RequestRow {
  request: CustomRequest;
  proposal: CustomProposal | undefined;
  customServiceOrder: CustomServiceOrder | null;
  counterpartId: string;
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "production" | "negotiation" | "completed">("all");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
            counterpartId,
            counterpartName: counterpart?.display_name ?? counterpart?.username ?? "Usuário",
            counterpartRating: counterpart?.rating ?? 0,
            counterpartRatingCount: counterpart?.rating_count ?? 0,
            myRole,
          };
        }),
      );
    }

    async function load() {
      setLoadError(null);
      try {
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
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Não foi possível carregar seus pedidos.");
          setRows([]);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, role, reloadKey]);

  if (!userId) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Entre na sua conta"
        description="Faça login para ver suas mensagens e pedidos personalizados."
        action={
          <Link
            href="/entrar"
            className="rounded-(--radius-pill) bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
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

  if (loadError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
        <p className="font-semibold text-(--color-text)">Não foi possível carregar os pedidos</p>
        <p className="text-sm text-(--color-text-muted)">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setRows(null);
            setReloadKey((value) => value + 1);
          }}
          className="text-sm font-medium text-(--color-accent-text) hover:underline"
        >
          Tentar de novo
        </button>
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

  if (role === "all") {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    const statusFor = (row: RequestRow) => row.customServiceOrder?.status ?? row.request.status;
    const isProduction = (row: RequestRow) => statusFor(row) === "in_progress";
    const isNegotiation = (row: RequestRow) =>
      ["pending", "negotiating", "proposal_sent", "accepted", "awaiting_payment", "paid"].includes(
        statusFor(row),
      );
    const isCompleted = (row: RequestRow) =>
      ["delivered", "completed"].includes(statusFor(row));

    const filteredRows = rows.filter((row) => {
      const service = row.proposal?.serviceType || row.request.description;
      const matchesSearch =
        !query ||
        row.counterpartName.toLocaleLowerCase("pt-BR").includes(query) ||
        service.toLocaleLowerCase("pt-BR").includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "production" && isProduction(row)) ||
        (filter === "negotiation" && isNegotiation(row)) ||
        (filter === "completed" && isCompleted(row));

      return matchesSearch && matchesFilter;
    });

    const priorityRow = filteredRows.find(isProduction) ?? null;
    const recentRows = priorityRow
      ? filteredRows.filter((row) => row.request.id !== priorityRow.request.id)
      : filteredRows;

    function conversationHref(row: RequestRow): string {
      return `${row.myRole === "creator" ? "/dashboard/pedidos-personalizados" : "/pedidos"}/${row.request.id}`;
    }

    function serviceLabel(row: RequestRow): string {
      return row.proposal?.serviceType || row.request.description;
    }

    function rowPrice(row: RequestRow): string | null {
      if (row.customServiceOrder) return formatBRLFromCents(row.customServiceOrder.agreedAmountCents);
      if (row.proposal) return formatBRLFromCents(row.proposal.priceCents);
      return null;
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-(--color-text)">Mensagens</h1>
            <p className="mt-1 text-sm text-(--color-text-muted)">
              Conversas, propostas e pedidos personalizados.
            </p>
          </div>
          <span className="flex-shrink-0 text-3xl font-bold leading-none text-(--color-accent)">
            {rows.length}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar conversa ou serviço"
            aria-label="Buscar conversa ou serviço"
            className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-base text-(--color-text) shadow-sm outline-none transition-colors placeholder:text-(--color-text-subtle) focus:border-(--color-accent-text) sm:text-sm"
          />

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {[
              ["all", "Todas"],
              ["production", "Produção"],
              ["negotiation", "Negociação"],
              ["completed", "Concluídas"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as typeof filter)}
                className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === value
                    ? "border-(--color-contrast) bg-(--color-contrast) text-(--color-on-contrast)"
                    : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:border-(--color-accent-text)"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-10 text-center">
            <p className="font-semibold text-(--color-text)">Nenhuma conversa encontrada</p>
            <p className="mt-1 text-sm text-(--color-text-muted)">
              Tente outro termo ou altere o filtro selecionado.
            </p>
          </div>
        ) : (
          <>
            {priorityRow ? (
              <section className="flex flex-col gap-2">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
                  Prioridade
                </p>
                <Link
                  href={conversationHref(priorityRow)}
                  className="rounded-2xl bg-(--color-contrast) p-4 text-(--color-on-contrast) shadow-lg transition-opacity hover:opacity-95"
                >
                  <div className="flex items-start gap-3">
                    <MediaPlaceholder
                      seed={priorityRow.counterpartId}
                      kind="avatar"
                      label={priorityRow.counterpartName}
                      className="h-10 w-10 flex-shrink-0 border-(--color-on-contrast)"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-semibold text-(--color-on-contrast)">
                          {priorityRow.counterpartName}
                        </span>
                        <StatusBadge status={statusFor(priorityRow)} variant="inline" />
                      </div>
                      <p className="mt-1 truncate text-sm text-(--color-on-contrast) opacity-75">
                        {serviceLabel(priorityRow)}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-(--color-on-contrast) pt-3">
                        <span className="text-sm font-bold text-(--color-accent)">
                          {rowPrice(priorityRow) ?? "Em andamento"}
                        </span>
                        <span className="text-xs text-(--color-on-contrast) opacity-65">
                          {priorityRow.customServiceOrder
                            ? `Prazo ${new Date(priorityRow.customServiceOrder.deliveryDeadlineAt).toLocaleDateString("pt-BR")}`
                            : new Date(priorityRow.request.updatedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            ) : null}

            {recentRows.length > 0 ? (
              <section className="flex flex-col gap-2">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
                  {priorityRow ? "Recentes" : "Conversas"}
                </p>
                <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
                  {recentRows.map((row, index) => (
                    <Link
                      key={row.request.id}
                      href={conversationHref(row)}
                      className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-(--color-surface-2) ${
                        index > 0 ? "border-t border-(--color-border)" : ""
                      }`}
                    >
                      <MediaPlaceholder
                        seed={row.counterpartId}
                        kind="avatar"
                        label={row.counterpartName}
                        className="h-10 w-10 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate font-semibold text-(--color-text)">
                            {row.counterpartName}
                          </span>
                          <StatusBadge status={statusFor(row)} />
                        </div>
                        <p className="mt-1 truncate text-sm text-(--color-text-muted)">
                          {serviceLabel(row)}
                        </p>
                        <div className="mt-1.5 flex min-w-0 items-center gap-2 text-xs text-(--color-text-subtle)">
                          {row.counterpartRatingCount > 0 ? (
                            <RatingStars
                              rating={row.counterpartRating}
                              ratingCount={row.counterpartRatingCount}
                              size={12}
                            />
                          ) : null}
                          <span className="truncate">
                            {new Date(row.request.updatedAt).toLocaleDateString("pt-BR")}
                            {rowPrice(row) ? ` · ${rowPrice(row)}` : ""}
                            {row.customServiceOrder
                              ? ` · prazo ${new Date(row.customServiceOrder.deliveryDeadlineAt).toLocaleDateString("pt-BR")}`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    );
  }

  const query = search.trim().toLocaleLowerCase("pt-BR");
  const statusFor = (row: RequestRow) => row.customServiceOrder?.status ?? row.request.status;
  const isProduction = (row: RequestRow) => statusFor(row) === "in_progress";
  const isNegotiation = (row: RequestRow) =>
    ["pending", "negotiating", "proposal_sent", "accepted", "awaiting_payment", "paid"].includes(
      statusFor(row),
    );
  const isCompleted = (row: RequestRow) =>
    ["delivered", "completed"].includes(statusFor(row));

  const filteredRows = rows.filter((row) => {
    const service = row.proposal?.serviceType || row.request.description;
    const matchesSearch =
      !query ||
      row.counterpartName.toLocaleLowerCase("pt-BR").includes(query) ||
      service.toLocaleLowerCase("pt-BR").includes(query);
    const matchesFilter =
      filter === "all" ||
      (filter === "production" && isProduction(row)) ||
      (filter === "negotiation" && isNegotiation(row)) ||
      (filter === "completed" && isCompleted(row));
    return matchesSearch && matchesFilter;
  });

  const priorityRow = filteredRows.find(isProduction) ?? null;
  const remainingRows = priorityRow
    ? filteredRows.filter((row) => row.request.id !== priorityRow.request.id)
    : filteredRows;

  const hrefFor = (row: RequestRow) =>
    `${row.myRole === "creator" ? "/dashboard/pedidos-personalizados" : "/pedidos"}/${row.request.id}`;

  const serviceFor = (row: RequestRow) => row.proposal?.serviceType || row.request.description;

  const priceFor = (row: RequestRow) => {
    if (row.customServiceOrder) return formatBRLFromCents(row.customServiceOrder.agreedAmountCents);
    if (row.proposal) return formatBRLFromCents(row.proposal.priceCents);
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={role === "creator" ? "Buscar cliente ou serviço" : "Buscar conversa ou serviço"}
          aria-label="Buscar pedidos"
          className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-base text-(--color-text) shadow-sm outline-none placeholder:text-(--color-text-subtle) focus:border-(--color-accent-text) sm:text-sm"
        />
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {[
            ["all", "Todos"],
            ["production", "Produção"],
            ["negotiation", "Negociação"],
            ["completed", "Concluídos"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as typeof filter)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === value
                  ? "border-(--color-contrast) bg-(--color-contrast) text-(--color-on-contrast)"
                  : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:border-(--color-accent-text)"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-9 text-center">
          <p className="font-semibold text-(--color-text)">Nenhum pedido encontrado</p>
          <p className="mt-1 text-sm text-(--color-text-muted)">Tente outro termo ou mude o filtro.</p>
        </div>
      ) : (
        <>
          {priorityRow ? (
            <section className="flex flex-col gap-2">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
                Em produção agora
              </p>
              <Link
                href={hrefFor(priorityRow)}
                className="rounded-2xl bg-(--color-contrast) p-4 text-(--color-on-contrast) shadow-sm transition-opacity hover:opacity-95"
              >
                <div className="flex items-start gap-3">
                  <MediaPlaceholder
                    seed={priorityRow.counterpartId}
                    kind="avatar"
                    label={priorityRow.counterpartName}
                    className="h-10 w-10 shrink-0 border-(--color-on-contrast)"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold">{priorityRow.counterpartName}</span>
                      <StatusBadge status={statusFor(priorityRow)} variant="inline" />
                    </div>
                    <p className="mt-1 truncate text-sm opacity-75">{serviceFor(priorityRow)}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-(--color-on-contrast) pt-3">
                      <span className="text-sm font-bold text-(--color-accent)">
                        {priceFor(priorityRow) ?? "Em andamento"}
                      </span>
                      <span className="text-xs opacity-65">
                        {priorityRow.customServiceOrder
                          ? `Prazo ${new Date(priorityRow.customServiceOrder.deliveryDeadlineAt).toLocaleDateString("pt-BR")}`
                          : new Date(priorityRow.request.updatedAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          ) : null}

          {remainingRows.length > 0 ? (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
                  {priorityRow ? "Outros pedidos" : "Pedidos"}
                </p>
                <span className="text-xs text-(--color-text-subtle)">{filteredRows.length}</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
                {remainingRows.map((row, index) => (
                  <Link
                    key={row.request.id}
                    href={hrefFor(row)}
                    className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-(--color-surface-2) ${
                      index > 0 ? "border-t border-(--color-border)" : ""
                    }`}
                  >
                    <MediaPlaceholder
                      seed={row.counterpartId}
                      kind="avatar"
                      label={row.counterpartName}
                      className="h-10 w-10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-semibold text-(--color-text)">{row.counterpartName}</span>
                        <StatusBadge status={statusFor(row)} />
                      </div>
                      <p className="mt-1 truncate text-sm text-(--color-text-muted)">{serviceFor(row)}</p>
                      <div className="mt-1.5 flex min-w-0 items-center gap-2 text-xs text-(--color-text-subtle)">
                        {row.counterpartRatingCount > 0 ? (
                          <RatingStars
                            rating={row.counterpartRating}
                            ratingCount={row.counterpartRatingCount}
                            size={12}
                          />
                        ) : null}
                        <span className="truncate">
                          {new Date(row.request.updatedAt).toLocaleDateString("pt-BR")}
                          {priceFor(row) ? ` · ${priceFor(row)}` : ""}
                          {row.customServiceOrder
                            ? ` · prazo ${new Date(row.customServiceOrder.deliveryDeadlineAt).toLocaleDateString("pt-BR")}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
