import type { Message } from "@/lib/types";
import type { MessageRepository } from "@/lib/repositories/MessageRepository";
import type { ConversationRepository } from "@/lib/repositories/ConversationRepository";
import type { CustomRequestRepository } from "@/lib/repositories/CustomRequestRepository";
import type { NotificationRepository } from "@/lib/repositories/NotificationRepository";
import { assertParticipant } from "@/lib/services/CustomRequestService";

export class MessageService {
  constructor(
    private messageRepo: MessageRepository,
    private conversationRepo: ConversationRepository,
    private customRequestRepo: CustomRequestRepository,
    private notificationRepo: NotificationRepository,
  ) {}

  /**
   * TODO(integração): rate limiting server-side no envio de mensagens.
   */
  sendText(actingUserId: string, conversationId: string, content: string): Message {
    const conversation = this.conversationRepo.findById(conversationId);
    if (!conversation) throw new Error("Conversa não encontrada.");
    const request = this.customRequestRepo.findById(conversation.customRequestId);
    if (!request) throw new Error("Pedido não encontrado.");
    assertParticipant(request, actingUserId);

    if (conversation.status === "closed") {
      throw new Error("Esta conversa está encerrada.");
    }

    const trimmed = content.trim();
    if (!trimmed) throw new Error("Mensagem vazia.");

    const now = new Date().toISOString();
    const message: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: actingUserId,
      type: "text",
      content: trimmed,
      createdAt: now,
    };
    this.messageRepo.create(message);
    this.conversationRepo.update(conversationId, { updatedAt: now, lastMessageAt: now });

    // Se o pedido ainda está "pending" (sem nenhuma resposta do criador),
    // uma primeira mensagem trocada já indica negociação em andamento.
    if (request.status === "pending" && actingUserId !== request.requesterId) {
      this.customRequestRepo.update(request.id, { status: "negotiating", updatedAt: now });
    }

    const recipientId = actingUserId === request.requesterId ? request.creatorId : request.requesterId;
    this.notificationRepo.create({
      id: `notif-${Date.now()}`,
      userId: recipientId,
      type: "CUSTOM_MESSAGE_RECEIVED",
      title: "Nova mensagem",
      body: "Você recebeu uma nova mensagem em um pedido personalizado.",
      linkHref: `/dashboard/pedidos-personalizados/${request.id}`,
      read: false,
      createdAt: now,
    });

    return message;
  }

  softDelete(actingUserId: string, messageId: string): void {
    const message = this.messageRepo.findById(messageId);
    if (!message) throw new Error("Mensagem não encontrada.");
    const conversation = this.conversationRepo.findById(message.conversationId);
    if (!conversation) throw new Error("Conversa não encontrada.");
    const request = this.customRequestRepo.findById(conversation.customRequestId);
    if (!request) throw new Error("Pedido não encontrado.");
    assertParticipant(request, actingUserId);
    if (message.senderId !== actingUserId) {
      throw new Error("Só é possível ocultar mensagens enviadas por você.");
    }
    this.messageRepo.update(messageId, { deletedAt: new Date().toISOString() });
  }
}
