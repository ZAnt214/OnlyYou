import type { CustomRequest, Conversation, Message, User } from "@/lib/types";
import type { CustomRequestRepository } from "@/lib/repositories/CustomRequestRepository";
import type { ConversationRepository } from "@/lib/repositories/ConversationRepository";
import type { MessageRepository } from "@/lib/repositories/MessageRepository";
import type { NotificationRepository } from "@/lib/repositories/NotificationRepository";

/**
 * Estados de verificação em que um criador NÃO pode receber pedidos de
 * conteúdo personalizado. Usado tanto para esconder o botão na UI quanto
 * (principalmente) como validação server-side em createRequest — a UI
 * nunca é a única barreira, já que qualquer chamada direta ao serviço com
 * um creatorId arbitrário passaria pelo mesmo check.
 */
const INELIGIBLE_VERIFICATION_STATUSES = new Set(["suspended", "rejected"]);

export function isEligibleForCustomRequests(creator: Pick<User, "creatorProfile">): boolean {
  const status = creator.creatorProfile?.verificationStatus;
  if (!status) return false;
  return !INELIGIBLE_VERIFICATION_STATUSES.has(status);
}

/**
 * Verifica se o usuário é participante (requester ou creator) do pedido —
 * é o equivalente honesto de uma checagem de autorização (IDOR) possível
 * numa aplicação mock sem backend real: a validação vive na camada de
 * serviço, nunca só no componente.
 */
export function assertParticipant(request: CustomRequest, actingUserId: string): void {
  if (request.requesterId !== actingUserId && request.creatorId !== actingUserId) {
    throw new Error("Usuário não tem permissão para acessar este pedido.");
  }
}

export class CustomRequestService {
  constructor(
    private customRequestRepo: CustomRequestRepository,
    private conversationRepo: ConversationRepository,
    private messageRepo: MessageRepository,
    private notificationRepo: NotificationRepository,
  ) {}

  /**
   * Cria o CustomRequest junto com a Conversation e a mensagem inicial, e
   * notifica o criador. Regra de negócio (rate limiting, elegibilidade)
   * vive aqui, não no componente.
   *
   * TODO(integração): rate limiting server-side na criação de pedidos e
   * envio de mensagens — nesta fase de mock não há limitação nenhuma.
   */
  createRequest(params: { requesterId: string; creator: User; description: string }): {
    request: CustomRequest;
    conversation: Conversation;
  } {
    if (params.requesterId === params.creator.id) {
      throw new Error("Não é possível pedir conteúdo personalizado para si mesmo.");
    }
    if (!isEligibleForCustomRequests(params.creator)) {
      throw new Error("Este criador não está disponível para pedidos personalizados no momento.");
    }
    const description = params.description.trim();
    if (!description) {
      throw new Error("Descreva o que você gostaria de receber.");
    }

    const now = new Date().toISOString();
    const requestId = `cr-${Date.now()}`;
    const conversationId = `conv-${Date.now()}`;

    const request: CustomRequest = {
      id: requestId,
      requesterId: params.requesterId,
      creatorId: params.creator.id,
      description,
      status: "pending",
      conversationId,
      createdAt: now,
      updatedAt: now,
    };
    this.customRequestRepo.create(request);

    const conversation: Conversation = {
      id: conversationId,
      customRequestId: requestId,
      status: "open",
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    };
    this.conversationRepo.create(conversation);

    const systemMessage: Message = {
      id: `msg-${Date.now()}-sys`,
      conversationId,
      senderId: params.requesterId,
      type: "system",
      content: "Pedido de conteúdo personalizado criado.",
      createdAt: now,
    };
    this.messageRepo.create(systemMessage);

    const initialMessage: Message = {
      id: `msg-${Date.now()}-txt`,
      conversationId,
      senderId: params.requesterId,
      type: "text",
      content: description,
      createdAt: now,
    };
    this.messageRepo.create(initialMessage);

    this.notificationRepo.create({
      id: `notif-${Date.now()}`,
      userId: params.creator.id,
      type: "CUSTOM_REQUEST_CREATED",
      title: "Novo pedido personalizado",
      body: `Você recebeu um novo pedido de conteúdo personalizado.`,
      linkHref: `/dashboard/pedidos-personalizados/${requestId}`,
      read: false,
      createdAt: now,
    });

    return { request, conversation };
  }

  get(actingUserId: string, requestId: string): CustomRequest {
    const request = this.customRequestRepo.findById(requestId);
    if (!request) throw new Error("Pedido não encontrado.");
    assertParticipant(request, actingUserId);
    return request;
  }

  listForRequester(requesterId: string): CustomRequest[] {
    return this.customRequestRepo
      .findByRequester(requesterId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  listForCreator(creatorId: string): CustomRequest[] {
    return this.customRequestRepo
      .findByCreator(creatorId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
