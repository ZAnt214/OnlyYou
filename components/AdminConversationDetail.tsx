"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getCustomRequestById,
  listMessagesForConversation,
  listProposalsForRequest,
  getCustomServiceOrderByRequest,
  listAttachmentsForMessage,
} from "@/lib/supabase/customRequests";
import { reportRepository } from "@/lib/repositories/ReportRepository";
import { auditLogRepository } from "@/lib/security/AuditLogRepository";
import { newId } from "@/lib/utils/id";
import { StatusBadge } from "@/components/StatusBadge";
import type {
  Report,
  CustomRequest,
  Conversation,
  Message,
  MessageAttachment,
  CustomProposal,
  CustomServiceOrder,
} from "@/lib/types";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function AdminConversationDetail({
  customRequestId,
  adminId,
}: {
  customRequestId: string;
  adminId: string;
}) {
  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposals, setProposals] = useState<CustomProposal[]>([]);
  const [customServiceOrder, setCustomServiceOrder] = useState<CustomServiceOrder | null>(null);
  const [attachmentsByMessage, setAttachmentsByMessage] = useState<Record<string, MessageAttachment[]>>({});
  const [names, setNames] = useState<{ requester: string; creator: string }>({ requester: "", creator: "" });
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const loggedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const req = await getCustomRequestById(supabase, customRequestId);
      if (!req) {
        setLoading(false);
        return;
      }
      const { data: convoRow } = await supabase
        .from("conversations")
        .select("*")
        .eq("custom_request_id", req.id)
        .single();
      if (!convoRow) {
        setLoading(false);
        return;
      }
      const convo: Conversation = {
        id: convoRow.id,
        customRequestId: convoRow.custom_request_id,
        status: convoRow.status,
        createdAt: convoRow.created_at,
        updatedAt: convoRow.updated_at,
        lastMessageAt: convoRow.last_message_at,
      };

      const [msgs, props, cso, requester, creator, allReports] = await Promise.all([
        listMessagesForConversation(supabase, convo.id),
        listProposalsForRequest(supabase, req.id),
        getCustomServiceOrderByRequest(supabase, req.id),
        supabase.from("profiles").select("username").eq("id", req.requesterId).maybeSingle(),
        supabase.from("profiles").select("username").eq("id", req.creatorId).maybeSingle(),
        reportRepository.findAll(),
      ]);

      const deliveryMessages = msgs.filter((m) => m.type === "delivery");
      const attachmentEntries = await Promise.all(
        deliveryMessages.map(async (m) => [m.id, await listAttachmentsForMessage(supabase, m.id)] as const),
      );

      setRequest(req);
      setConversation(convo);
      setMessages(msgs);
      setProposals(props);
      setCustomServiceOrder(cso);
      setAttachmentsByMessage(Object.fromEntries(attachmentEntries));
      setNames({
        requester: requester.data?.username ?? req.requesterId,
        creator: creator.data?.username ?? req.creatorId,
      });
      setReports(allReports);
      setLoading(false);

      if (!loggedRef.current) {
        loggedRef.current = true;
        void auditLogRepository.append({
          id: newId("audit"),
          actorId: adminId,
          action: "view_conversation",
          entityType: "conversation",
          entityId: convo.id,
          metadata: { customRequestId },
          createdAt: new Date().toISOString(),
        });
      }
    }
    void load();
  }, [customRequestId, adminId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-(--color-text-muted)">
        <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
        Carregando…
      </div>
    );
  }

  if (!request || !conversation) {
    return <p className="text-sm text-(--color-text-muted)">Conversa não encontrada.</p>;
  }

  const relatedReports = reports.filter(
    (r) => r.conversationId === conversation.id || r.customRequestId === request.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-(--color-border) p-4 text-sm">
          <h2 className="mb-2 font-medium text-(--color-text)">Pedido</h2>
          <dl className="flex flex-col gap-1 text-(--color-text-muted)">
            <div className="flex justify-between gap-2">
              <dt>ID</dt>
              <dd className="text-(--color-text)">{request.id}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Status</dt>
              <dd>
                <StatusBadge status={request.status} />
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Usuário</dt>
              <dd className="text-(--color-text)">{names.requester}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Criador</dt>
              <dd className="text-(--color-text)">{names.creator}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Criado em</dt>
              <dd>{formatDateTime(request.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-(--color-border) p-4 text-sm">
          <h2 className="mb-2 font-medium text-(--color-text)">Contratação</h2>
          {customServiceOrder ? (
            <dl className="flex flex-col gap-1 text-(--color-text-muted)">
              <div className="flex justify-between gap-2">
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={customServiceOrder.status} />
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Valor combinado</dt>
                <dd className="text-(--color-text)">
                  {formatBRLFromCents(customServiceOrder.agreedAmountCents)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Prazo de entrega</dt>
                <dd>{formatDateTime(customServiceOrder.deliveryDeadlineAt)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Order (Mercado Pago)</dt>
                <dd className="text-(--color-text)">{customServiceOrder.orderId}</dd>
              </div>
              {customServiceOrder.deliveredAt ? (
                <div className="flex justify-between gap-2">
                  <dt>Entregue em</dt>
                  <dd>{formatDateTime(customServiceOrder.deliveredAt)}</dd>
                </div>
              ) : null}
              {customServiceOrder.completedAt ? (
                <div className="flex justify-between gap-2">
                  <dt>Concluído em</dt>
                  <dd>{formatDateTime(customServiceOrder.completedAt)}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-(--color-text-muted)">Nenhuma contratação (pagamento) ainda.</p>
          )}
        </div>
      </div>

      {proposals.length > 0 ? (
        <div className="rounded-md border border-(--color-border) p-4 text-sm">
          <h2 className="mb-2 font-medium text-(--color-text)">Propostas</h2>
          <div className="flex flex-col gap-2">
            {proposals.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 border-b border-(--color-border) pb-2 last:border-0 last:pb-0">
                <span className="text-(--color-text-muted)">
                  {p.serviceType} · {formatBRLFromCents(p.priceCents)} · {p.deliveryDays} dias
                </span>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {relatedReports.length > 0 ? (
        <div className="rounded-md border border-(--color-border) p-4 text-sm">
          <h2 className="mb-2 font-medium text-(--color-text)">Denúncias relacionadas</h2>
          <div className="flex flex-col gap-2">
            {relatedReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 border-b border-(--color-border) pb-2 last:border-0 last:pb-0">
                <span className="text-(--color-text-muted)">{r.reason} — {r.description}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-md border border-(--color-border) p-4">
        <h2 className="mb-3 text-sm font-medium text-(--color-text)">Histórico de mensagens</h2>
        <div className="flex flex-col gap-2">
          {messages.map((m) => {
            const attachments = attachmentsByMessage[m.id] ?? [];
            const senderName = m.senderId === request.requesterId ? names.requester : names.creator;
            return (
              <div key={m.id} className="rounded-md border border-(--color-border) px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2 text-xs text-(--color-text-subtle)">
                  <span>
                    {senderName} · {m.type}
                    {m.deletedAt ? " · oculta pelo autor" : ""}
                  </span>
                  <span>{formatDateTime(m.createdAt)}</span>
                </div>
                <p className="mt-1 text-(--color-text)">{m.content}</p>
                {attachments.length > 0 ? (
                  <ul className="mt-1 text-xs text-(--color-text-muted)">
                    {attachments.map((a) => (
                      <li key={a.id}>
                        {a.fileName} · {(a.size / 1024 / 1024).toFixed(1)} MB
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
