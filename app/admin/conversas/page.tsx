import Link from "next/link";
import { ChevronRight, Flag, MessageSquare } from "lucide-react";
import { requireAdmin } from "@/lib/security/adminAuth";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { listAdminConversationSummaries } from "@/lib/supabase/customRequests";
import { StatusBadge } from "@/components/StatusBadge";

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  ["", "Todos os status"],
  ["pending", "Pendente"],
  ["negotiating", "Em negociação"],
  ["proposal_sent", "Proposta enviada"],
  ["accepted", "Aceito"],
  ["in_progress", "Em produção"],
  ["delivered", "Entregue"],
  ["completed", "Concluído"],
  ["disputed", "Em disputa"],
  ["declined", "Recusado"],
  ["cancelled", "Cancelado"],
] as const;

export default async function AdminConversasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pagina?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();
  const requestedPage = Number.parseInt(params.pagina ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const supabase = await createServerClient();
  const result = await listAdminConversationSummaries(supabase, {
    status: status || undefined,
    query: query || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE));

  function hrefFor(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (status) search.set("status", status);
    if (nextPage > 1) search.set("pagina", String(nextPage));
    const suffix = search.toString();
    return `/admin/conversas${suffix ? `?${suffix}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Conversas</h1>
        <p className="text-sm text-(--color-text-muted)">
          Acompanhe pedidos personalizados e abra o histórico completo somente quando precisar.
        </p>
      </div>

      <form
        method="get"
        action="/admin/conversas"
        className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_13rem_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar usuário, criador ou ID"
          aria-label="Buscar conversas"
          className="min-w-0 rounded-xl border border-(--color-border) bg-(--color-surface) px-3.5 py-2.5 text-base text-(--color-text) outline-none placeholder:text-(--color-text-subtle) focus:border-(--color-accent-text) sm:text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-(--color-border) bg-(--color-surface) px-3.5 py-2.5 text-base text-(--color-text) outline-none focus:border-(--color-accent-text) sm:text-sm"
        >
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="min-h-11 rounded-full bg-(--color-text) px-4 py-2.5 text-sm font-semibold text-(--color-bg)"
        >
          Filtrar
        </button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-(--color-text-subtle)">
          {result.totalCount} {result.totalCount === 1 ? "conversa" : "conversas"}
        </p>
        {query || status ? (
          <Link
            href="/admin/conversas"
            className="text-xs font-semibold text-(--color-accent-text) hover:underline"
          >
            Limpar filtros
          </Link>
        ) : null}
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-(--color-border) px-5 py-9 text-center">
          <p className="font-semibold text-(--color-text)">Nenhuma conversa encontrada</p>
          <p className="mt-1 text-sm text-(--color-text-muted)">
            Tente outro filtro ou termo de busca.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
          {result.items.map((item) => (
            <Link
              key={item.conversationId}
              href={`/admin/conversas/${item.requestId}`}
              className="flex items-center gap-3 border-b border-(--color-border) px-4 py-3 last:border-b-0 hover:bg-(--color-surface-2)"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-(--color-surface-2) text-(--color-text-muted)">
                <MessageSquare size={16} strokeWidth={1.7} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-semibold text-(--color-text)">
                    {item.requesterName}
                    <span className="mx-1.5 font-normal text-(--color-text-subtle)">→</span>
                    {item.creatorName}
                  </p>
                  <StatusBadge status={item.requestStatus} />
                </div>

                <p className="mt-1 truncate text-xs text-(--color-text-muted)">
                  {item.lastMessageContent ?? "Sem mensagens ainda"}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-(--color-text-subtle)">
                  <span>
                    {new Date(item.lastMessageAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                  <span>Pedido {item.requestId.slice(0, 8)}</span>
                  {item.relatedReports > 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-(--color-danger)">
                      <Flag size={10} strokeWidth={1.8} />
                      {item.relatedReports} {item.relatedReports === 1 ? "denúncia" : "denúncias"}
                    </span>
                  ) : null}
                </div>
              </div>

              <ChevronRight
                size={18}
                strokeWidth={1.7}
                className="shrink-0 text-(--color-text-subtle)"
              />
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-between gap-3"
          aria-label="Paginação das conversas"
        >
          <Link
            href={hrefFor(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`rounded-full border border-(--color-border) px-4 py-2 text-sm ${
              page <= 1
                ? "pointer-events-none opacity-40"
                : "text-(--color-text) hover:bg-(--color-surface-2)"
            }`}
          >
            Anterior
          </Link>
          <span className="text-xs text-(--color-text-subtle)">
            Página {Math.min(page, totalPages)} de {totalPages}
          </span>
          <Link
            href={hrefFor(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`rounded-full border border-(--color-border) px-4 py-2 text-sm ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "text-(--color-text) hover:bg-(--color-surface-2)"
            }`}
          >
            Próxima
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
