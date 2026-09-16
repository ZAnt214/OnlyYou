"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConversationRepository } from "@/lib/repositories/ConversationRepository";
import { useCustomRequestRepository } from "@/lib/repositories/CustomRequestRepository";
import { useMessageRepository } from "@/lib/repositories/MessageRepository";
import { reportRepository } from "@/lib/repositories/ReportRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { StatusBadge } from "@/components/StatusBadge";
import type { Report, User } from "@/lib/types";

export function AdminConversationsTable() {
  const conversationRepo = useConversationRepository();
  const customRequestRepo = useCustomRequestRepository();
  const messageRepo = useMessageRepository();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    reportRepository.findAll().then(setReports);
    userRepository.findAll().then(setUsers);
  }, []);

  const usersById = new Map(users.map((u) => [u.id, u]));
  const conversations = conversationRepo.findAll();

  const rows = conversations
    .map((conversation) => {
      const request = customRequestRepo.findById(conversation.customRequestId);
      if (!request) return null;
      const messages = messageRepo.findByConversation(conversation.id);
      const lastMessage = messages[messages.length - 1];
      const relatedReports = reports.filter(
        (r) => r.conversationId === conversation.id || r.customRequestId === request.id,
      );
      return { conversation, request, lastMessage, relatedReports };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .filter((row) => {
      if (statusFilter !== "all" && row.request.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      const requester = usersById.get(row.request.requesterId);
      const creator = usersById.get(row.request.creatorId);
      return (
        row.conversation.id.toLowerCase().includes(q) ||
        row.request.id.toLowerCase().includes(q) ||
        requester?.username.toLowerCase().includes(q) ||
        creator?.username.toLowerCase().includes(q)
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
          className="min-w-64 flex-1 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
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

      {rows.length === 0 ? (
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
              {rows.map(({ conversation, request, lastMessage, relatedReports }) => (
                <tr key={conversation.id} className="border-b border-(--color-border) last:border-0">
                  <td className="px-4 py-3 text-(--color-text)">{conversation.id}</td>
                  <td className="px-4 py-3 text-(--color-text-muted)">{request.id}</td>
                  <td className="px-4 py-3 text-(--color-text-muted)">
                    {usersById.get(request.requesterId)?.username ?? request.requesterId}
                  </td>
                  <td className="px-4 py-3 text-(--color-text-muted)">
                    {usersById.get(request.creatorId)?.username ?? request.creatorId}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-(--color-text-muted)">
                    {lastMessage?.content ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-(--color-text-muted)">
                    {new Date(conversation.lastMessageAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-(--color-text-muted)">{relatedReports.length}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/conversas/${request.id}`}
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
