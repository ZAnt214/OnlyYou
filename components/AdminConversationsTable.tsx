"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  listAllConversationsForAdmin,
  listMessagesForConversation,
} from "@/lib/supabase/customRequests";
import { reportRepository } from "@/lib/repositories/ReportRepository";
import { StatusBadge } from "@/components/StatusBadge";
import type { Report, Conversation, CustomRequest } from "@/lib/types";

interface Row {
  conversation: Conversation;
  request: CustomRequest;
  lastMessageContent: string | null;
  requesterName: string;
  creatorName: string;
  relatedReports: Report[];
}

export function AdminConversationsTable() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [conversations, reports] = await Promise.all([
        listAllConversationsForAdmin(supabase),
        reportRepository.findAll(),
      ]);

      const built = await Promise.all(
        conversations.map(async ({ conversation, request }) => {
          const [messages, requester, creator] = await Promise.all([
            listMessagesForConversation(supabase, conversation.id),
            supabase.from("profiles").select("username").eq("id", request.requesterId).maybeSingle(),
            supabase.from("profiles").select("username").eq("id", request.creatorId).maybeSingle(),
          ]);
          const lastMessage = messages[messages.length - 1];
          const relatedReports = reports.filter(
            (r) => r.conversationId === conversation.id || r.customRequestId === request.id,
          );
          return {
            conversation,
            request,
            lastMessageContent: lastMessage?.content ?? null,
            requesterName: requester.data?.username ?? request.requesterId,
            creatorName: creator.data?.username ?? request.creatorId,
            relatedReports,
          };
        }),
      );

      setRows(built);
    }
    void load();
  }, []);

  if (rows === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-(--color-text-muted)">
        <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
        Carregando…
      </div>
    );
  }

  const filtered = rows
    .filter((row) => {
      if (statusFilter !== "all" && row.request.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        row.conversation.id.toLowerCase().includes(q) ||
        row.request.id.toLowerCase().includes(q) ||
        row.requesterName.toLowerCase().includes(q) ||
        row.creatorName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.conversation.lastMessageAt.localeCompare(a.conversation.lastMessageAt));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por ID de pedido, conversa ou usuário"
          className="min-w-64 flex-1 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="negotiating">Em negociação</option>
          <option value="proposal_sent">Proposta enviada</option>
          <option value="accepted">Aceito</option>
          <option value="in_progress">Em produção</option>
          <option value="delivered">Entregue</option>
          <option value="completed">Concluído</option>
          <option value="disputed">Em disputa</option>
          <option value="declined">Recusado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">Nenhuma conversa encontrada.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-(--color-border)">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-subtle)">
                <th className="px-4 py-2 font-medium">Conversa</th>
                <th className="px-4 py-2 font-medium">Pedido</th>
                <th className="px-4 py-2 font-medium">Usuário</th>
                <th className="px-4 py-2 font-medium">Criador</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Última mensagem</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Denúncias</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.conversation.id} className="border-b border-(--color-border) last:border-0">
                  <td className="px-4 py-3 text-(--color-text)">{row.conversation.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-(--color-text-muted)">{row.request.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-(--color-text-muted)">{row.requesterName}</td>
                  <td className="px-4 py-3 text-(--color-text-muted)">{row.creatorName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.request.status} />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-(--color-text-muted)">
                    {row.lastMessageContent ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-(--color-text-muted)">
                    {new Date(row.conversation.lastMessageAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-(--color-text-muted)">{row.relatedReports.length}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/conversas/${row.request.id}`}
                      className="rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text) hover:bg-(--color-surface)"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
