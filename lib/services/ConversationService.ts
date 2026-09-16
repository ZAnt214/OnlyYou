import type { Conversation, Message, CustomRequest } from "@/lib/types";
import type { ConversationRepository } from "@/lib/repositories/ConversationRepository";
import type { MessageRepository } from "@/lib/repositories/MessageRepository";
import type { CustomRequestRepository } from "@/lib/repositories/CustomRequestRepository";
import { assertParticipant } from "@/lib/services/CustomRequestService";

export interface ConversationContext {
  request: CustomRequest;
  conversation: Conversation;
  messages: Message[];
}

export class ConversationService {
  constructor(
    private conversationRepo: ConversationRepository,
    private messageRepo: MessageRepository,
    private customRequestRepo: CustomRequestRepository,
  ) {}

  /**
   * Carrega a conversa junto do pedido e das mensagens, já validando que
   * `actingUserId` é participante (requester ou creator) do pedido — esta
   * é a checagem de autorização de qualquer tela de conversa (dashboard do
   * criador, área do comprador ou reuso do mesmo componente para ambos).
   */
  loadContext(actingUserId: string, customRequestId: string): ConversationContext {
    const request = this.customRequestRepo.findById(customRequestId);
    if (!request) throw new Error("Pedido não encontrado.");
    assertParticipant(request, actingUserId);

    const conversation = this.conversationRepo.findByCustomRequest(customRequestId);
    if (!conversation) throw new Error("Conversa não encontrada.");

    const messages = this.messageRepo
      .findByConversation(conversation.id)
      .filter((m) => !m.deletedAt);

    return { request, conversation, messages };
  }
}
