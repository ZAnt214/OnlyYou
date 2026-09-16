import type { CustomServiceOrder, MessageAttachment } from "@/lib/types";
import type { CustomServiceOrderRepository } from "@/lib/repositories/CustomServiceOrderRepository";
import type { CustomRequestRepository } from "@/lib/repositories/CustomRequestRepository";
import type { ConversationRepository } from "@/lib/repositories/ConversationRepository";
import type { MessageRepository } from "@/lib/repositories/MessageRepository";
import type { NotificationRepository } from "@/lib/repositories/NotificationRepository";
import { messageAttachmentRepository } from "@/lib/repositories/MessageAttachmentRepository";
import { disputeRepository } from "@/lib/repositories/DisputeRepository";
import { auditLogRepository } from "@/lib/security/AuditLogRepository";
import { mockMediaStorageProvider } from "@/lib/payments/MediaStorageProvider";

export interface DeliveryFileInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Envio de entrega, confirmação de recebimento e abertura de disputa.
 *
 * TODO(integração): rotina server-side/cron para verificação de prazos —
 * nesta fase não há nenhuma checagem automática de deliveryDeadlineAt.
 * TODO(integração): integração real de refund com o provedor de pagamento —
 * um reembolso aqui é apenas uma transição de status, nenhuma reversão
 * financeira real acontece.
 */
export class CustomDeliveryService {
  constructor(
    private customServiceOrderRepo: CustomServiceOrderRepository,
    private customRequestRepo: CustomRequestRepository,
    private conversationRepo: ConversationRepository,
    private messageRepo: MessageRepository,
    private notificationRepo: NotificationRepository,
  ) {}

  async sendDelivery(
    actingUserId: string,
    customServiceOrderId: string,
    files: DeliveryFileInput[],
  ): Promise<CustomServiceOrder> {
    const cso = this.customServiceOrderRepo.findById(customServiceOrderId);
    if (!cso) throw new Error("Pedido não encontrado.");
    if (cso.creatorId !== actingUserId) {
      throw new Error("Só o criador pode enviar a entrega deste pedido.");
    }
    if (cso.status !== "in_progress") {
      throw new Error("Este pedido não está em produção.");
    }
    if (files.length === 0) {
      throw new Error("Anexe pelo menos um arquivo para enviar a entrega.");
    }

    const now = new Date().toISOString();
    const attachments: MessageAttachment[] = [];
    for (const file of files) {
      // Upload simulado — nenhum byte real é enviado/armazenado. Ver
      // TODO(integração) em lib/payments/MediaStorageProvider.ts.
      const asset = await mockMediaStorageProvider.upload({
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      });
      attachments.push(
        messageAttachmentRepository.create({
          id: `att-${asset.id}`,
          messageId: "", // preenchido abaixo, após criar a mensagem
          customRequestId: cso.customRequestId,
          uploaderId: actingUserId,
          fileName: file.fileName,
          mimeType: file.mimeType,
          size: file.sizeBytes,
          storageKey: `mock://media-storage/${asset.id}`,
          createdAt: now,
        }),
      );
    }

    const messageId = `msg-${Date.now()}`;
    for (const attachment of attachments) {
      attachment.messageId = messageId;
    }

    this.messageRepo.create({
      id: messageId,
      conversationId: this.conversationIdFor(cso.customRequestId),
      senderId: actingUserId,
      type: "delivery",
      content: "Conteúdo entregue.",
      createdAt: now,
      metadata: { customServiceOrderId: cso.id, attachmentIds: attachments.map((a) => a.id) },
    });
    this.conversationRepo.update(this.conversationIdFor(cso.customRequestId), {
      updatedAt: now,
      lastMessageAt: now,
    });

    this.customServiceOrderRepo.update(cso.id, { status: "delivered", deliveredAt: now });
    this.customRequestRepo.update(cso.customRequestId, { status: "delivered", updatedAt: now });

    this.notificationRepo.create({
      id: `notif-${Date.now()}`,
      userId: cso.requesterId,
      type: "CUSTOM_DELIVERY_SENT",
      title: "Conteúdo entregue",
      body: "O criador enviou a entrega do seu pedido personalizado.",
      linkHref: `/pedidos/${cso.customRequestId}`,
      read: false,
      createdAt: now,
    });

    void auditLogRepository.append({
      id: `audit-${Date.now()}`,
      actorId: actingUserId,
      action: "custom_order.delivered",
      entityType: "custom_service_order",
      entityId: cso.id,
      metadata: { fileCount: files.length },
      createdAt: now,
    });

    return { ...cso, status: "delivered", deliveredAt: now };
  }

  confirmReceipt(actingUserId: string, customServiceOrderId: string): CustomServiceOrder {
    const cso = this.customServiceOrderRepo.findById(customServiceOrderId);
    if (!cso) throw new Error("Pedido não encontrado.");
    if (cso.requesterId !== actingUserId) {
      throw new Error("Só o solicitante pode confirmar o recebimento.");
    }
    if (cso.status === "completed") return cso;
    if (cso.status !== "delivered") {
      throw new Error("Este pedido ainda não foi entregue.");
    }

    const now = new Date().toISOString();
    this.customServiceOrderRepo.update(cso.id, { status: "completed", completedAt: now });
    this.customRequestRepo.update(cso.customRequestId, { status: "completed", updatedAt: now });

    this.messageRepo.create({
      id: `msg-${Date.now()}`,
      conversationId: this.conversationIdFor(cso.customRequestId),
      senderId: actingUserId,
      type: "system",
      content: "Entrega confirmada pelo comprador. Pedido concluído.",
      createdAt: now,
      metadata: { customServiceOrderId: cso.id },
    });
    this.conversationRepo.update(this.conversationIdFor(cso.customRequestId), {
      updatedAt: now,
      lastMessageAt: now,
      status: "closed",
    });

    this.notificationRepo.create({
      id: `notif-${Date.now()}`,
      userId: cso.creatorId,
      type: "CUSTOM_SERVICE_COMPLETED",
      title: "Pedido concluído",
      body: "O comprador confirmou o recebimento. O pedido foi concluído.",
      linkHref: `/dashboard/pedidos-personalizados/${cso.customRequestId}`,
      read: false,
      createdAt: now,
    });

    void auditLogRepository.append({
      id: `audit-${Date.now()}`,
      actorId: actingUserId,
      action: "custom_order.completed",
      entityType: "custom_service_order",
      entityId: cso.id,
      metadata: {},
      createdAt: now,
    });

    return { ...cso, status: "completed", completedAt: now };
  }

  /**
   * "Relatar problema": registra uma Dispute simples e reflete o status no
   * pedido. Não há tela de gestão de disputas completa nesta fase — apenas
   * o registro e o estado refletido, para a equipe de moderação investigar
   * manualmente. Ver também lib/moderation/ReportService.ts para denúncias
   * de mensagem/conversa (fluxo distinto, mas relacionado).
   */
  reportProblem(actingUserId: string, customServiceOrderId: string, reason: string): CustomServiceOrder {
    const cso = this.customServiceOrderRepo.findById(customServiceOrderId);
    if (!cso) throw new Error("Pedido não encontrado.");
    if (cso.requesterId !== actingUserId && cso.creatorId !== actingUserId) {
      throw new Error("Usuário não tem permissão para relatar problema neste pedido.");
    }
    if (!reason.trim()) throw new Error("Descreva o problema.");

    const now = new Date().toISOString();
    void disputeRepository.create({
      id: `dispute-${Date.now()}`,
      customServiceOrderId: cso.id,
      customRequestId: cso.customRequestId,
      raisedBy: actingUserId,
      reason: reason.trim(),
      status: "open",
      createdAt: now,
    });

    this.customServiceOrderRepo.update(cso.id, { status: "disputed" });
    this.customRequestRepo.update(cso.customRequestId, { status: "disputed", updatedAt: now });

    const otherParty = actingUserId === cso.requesterId ? cso.creatorId : cso.requesterId;
    this.notificationRepo.create({
      id: `notif-${Date.now()}`,
      userId: otherParty,
      type: "CUSTOM_DISPUTE_CREATED",
      title: "Problema relatado",
      body: "Um problema foi relatado neste pedido personalizado. Nossa equipe vai analisar.",
      linkHref: `/dashboard/pedidos-personalizados/${cso.customRequestId}`,
      read: false,
      createdAt: now,
    });

    void auditLogRepository.append({
      id: `audit-${Date.now()}`,
      actorId: actingUserId,
      action: "custom_order.disputed",
      entityType: "custom_service_order",
      entityId: cso.id,
      metadata: { reason: reason.trim() },
      createdAt: now,
    });

    return { ...cso, status: "disputed" };
  }

  private conversationIdFor(customRequestId: string): string {
    const request = this.customRequestRepo.findById(customRequestId);
    if (!request) throw new Error("Pedido não encontrado.");
    return request.conversationId;
  }
}
