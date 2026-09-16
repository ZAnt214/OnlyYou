"use client";

import { useEffect, useRef, useState } from "react";
import { useConversationRepository } from "@/lib/repositories/ConversationRepository";
import { useCustomRequestRepository } from "@/lib/repositories/CustomRequestRepository";
import { useMessageRepository } from "@/lib/repositories/MessageRepository";
import { useCustomProposalRepository } from "@/lib/repositories/CustomProposalRepository";
import { useCustomServiceOrderRepository } from "@/lib/repositories/CustomServiceOrderRepository";
import { messageAttachmentRepository } from "@/lib/repositories/MessageAttachmentRepository";
import { reportRepository } from "@/lib/repositories/ReportRepository";
import { userRepository } from "@/lib/repositories/UserRepository";
import { auditLogRepository } from "@/lib/security/AuditLogRepository";
import { newId } from "@/lib/utils/id";
import { StatusBadge } from "@/components/StatusBadge";
import type { Report, User } from "@/lib/types";

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
  const conversationRepo = useConversationRepository();
  const customRequestRepo = useCustomRequestRepository();
  const messageRepo = useMessageRepository();
  const proposalRepo = useCustomProposalRepository();
  const customServiceOrderRepo = useCustomServiceOrderRepository();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const loggedRef = useRef(false);

  const request = customRequestRepo.findById(customRequestId);
  const conversation = request ? conversationRepo.findByCustomRequest(request.id) : null;

  useEffect(() => {
    reportRepository.findAll().then(setReports);
    userRepository.findAll().then(setUsers);
  }, []);

  // Toda visualização de uma conversa pela administração fica registrada em
  // AuditLog (action: "view_conversation"). Como as páginas /admin/* são
  // server components mas os dados de conversa são session-backed
  // (client-only, ver MockSessionProvider), o registro acontece aqui, no
  // primeiro render client-side desta tela — não há um "request" de
  // servidor por trás desta view nesta fase de mock.
  useEffect(() => {
    if (loggedRef.current || !conversation) return;
    loggedRef.current = true;
    void auditLogRepository.append({
      id: newId("audit"),
      actorId: adminId,
      action: "view_conversation",
      entityType: "conversation",
      entityId: conversation.id,
      metadata: { customRequestId },
      createdAt: new Date().toISOString(),
    });
  }, [conversation, adminId, customRequestId]);

  if (!request || !conversation) {
    return <p className="text-sm text-(--color-text-muted)">Conversa não encontrada.</p>;
  }

  const usersById = new Map(users.map((u) => [u.id, u]));
  const messages = messageRepo.findByConversation(conversation.id);
  const proposals = proposalRepo.findByCustomRequest(request.id);
  const customServiceOrder = customServiceOrderRepo.findByCustomRequest(request.id);
  const relatedReports = reports.filter(
    (r) => r.conversationId === conversation.id || r.customRequestId === request.id,
  );

  const requester = usersById.get(request.requesterId);
  const creator = usersById.get(request.creatorId);

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
              <dd className="text-(--color-text)">{requester?.username ?? request.requesterId}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Criador</dt>
              <dd className="text-(--color-text)">{creator?.username ?? request.creatorId}</dd>
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
                <dt>Order / Payment</dt>
                <dd className="text-(--color-text)">
                  {customServiceOrder.orderId} / {customServiceOrder.paymentId ?? "—"}
                </dd>
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
            const attachments =
              m.type === "delivery" ? messageAttachmentRepository.findByMessage(m.id) : [];
            return (
              <div key={m.id} className="rounded-md border border-(--color-border) px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2 text-xs text-(--color-text-subtle)">
                  <span>
                    {usersById.get(m.senderId)?.username ?? m.senderId} · {m.type}
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
