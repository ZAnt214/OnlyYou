import type { CustomProposal, Message } from "@/lib/types";
import type { CustomProposalRepository } from "@/lib/repositories/CustomProposalRepository";
import type { CustomRequestRepository } from "@/lib/repositories/CustomRequestRepository";
import type { ConversationRepository } from "@/lib/repositories/ConversationRepository";
import type { MessageRepository } from "@/lib/repositories/MessageRepository";
import type { NotificationRepository } from "@/lib/repositories/NotificationRepository";
import { assertParticipant } from "@/lib/services/CustomRequestService";

/**
 * Cria, aceita e recusa propostas. Nenhum método aqui confia em valores
 * enviados pelo cliente para decidir status/preço final — quem chama
 * (componente) só expressa intenção ("aceitar esta proposta"), e é este
 * serviço quem decide o que muda.
 */
export class ProposalService {
  constructor(
    private proposalRepo: CustomProposalRepository,
    private customRequestRepo: CustomRequestRepository,
    private conversationRepo: ConversationRepository,
    private messageRepo: MessageRepository,
    private notificationRepo: NotificationRepository,
  ) {}

  create(
    actingUserId: string,
    params: {
      customRequestId: string;
      serviceType: string;
      description: string;
      priceCents: number;
      deliveryDays: number;
    },
  ): CustomProposal {
    const request = this.customRequestRepo.findById(params.customRequestId);
    if (!request) throw new Error("Pedido não encontrado.");
    if (request.creatorId !== actingUserId) {
      throw new Error("Só o criador do pedido pode enviar uma proposta.");
    }
    if (!["pending", "negotiating"].includes(request.status)) {
      throw new Error("Este pedido não está mais aberto para novas propostas.");
    }
    if (params.priceCents <= 0) throw new Error("Valor inválido.");
    if (params.deliveryDays <= 0) throw new Error("Prazo inválido.");
    if (!params.serviceType.trim() || !params.description.trim()) {
      throw new Error("Preencha o tipo de serviço e a descrição da proposta.");
    }

    const now = new Date().toISOString();
    const proposal: CustomProposal = {
      id: `prop-${Date.now()}`,
      customRequestId: request.id,
      conversationId: request.conversationId,
      creatorId: request.creatorId,
      requesterId: request.requesterId,
      serviceType: params.serviceType.trim(),
      description: params.description.trim(),
      priceCents: params.priceCents,
      currency: "BRL",
      deliveryDays: params.deliveryDays,
      status: "sent",
      createdAt: now,
      updatedAt: now,
    };
    this.proposalRepo.create(proposal);

    const message: Message = {
      id: `msg-${Date.now()}`,
      conversationId: request.conversationId,
      senderId: actingUserId,
      type: "proposal",
      content: "Proposta enviada.",
      createdAt: now,
      metadata: { proposalId: proposal.id },
    };
    this.messageRepo.create(message);
    this.conversationRepo.update(request.conversationId, { updatedAt: now, lastMessageAt: now });

    this.customRequestRepo.update(request.id, { status: "proposal_sent", updatedAt: now });

    this.notificationRepo.create({
      id: `notif-${Date.now()}`,
      userId: request.requesterId,
      type: "CUSTOM_PROPOSAL_SENT",
      title: "Proposta recebida",
      body: `Você recebeu uma proposta para o seu pedido personalizado (${proposal.serviceType}).`,
      linkHref: `/pedidos/${request.id}`,
      read: false,
      createdAt: now,
    });

    return proposal;
  }

  accept(actingUserId: string, proposalId: string): CustomProposal {
    const proposal = this.proposalRepo.findById(proposalId);
    if (!proposal) throw new Error("Proposta não encontrada.");
    if (proposal.requesterId !== actingUserId) {
      throw new Error("Só o solicitante pode aceitar esta proposta.");
    }
    // Idempotência: se já foi aceita, apenas retorna o estado atual em vez
    // de duplicar mensagens/transições.
    if (proposal.status === "accepted") return proposal;
    if (proposal.status !== "sent") {
      throw new Error("Esta proposta não está mais disponível para aceite.");
    }

    const request = this.customRequestRepo.findById(proposal.customRequestId);
    if (!request) throw new Error("Pedido não encontrado.");
    assertParticipant(request, actingUserId);

    const now = new Date().toISOString();
    this.proposalRepo.update(proposal.id, { status: "accepted", updatedAt: now, acceptedAt: now });
    this.customRequestRepo.update(request.id, { status: "accepted", updatedAt: now, acceptedAt: now });

    this.messageRepo.create({
      id: `msg-${Date.now()}`,
      conversationId: request.conversationId,
      senderId: actingUserId,
      type: "system",
      content: "Proposta aceita. Para iniciar o serviço, conclua o pagamento.",
      createdAt: now,
      metadata: { proposalId: proposal.id },
    });
    this.conversationRepo.update(request.conversationId, { updatedAt: now, lastMessageAt: now });

    this.notificationRepo.create({
      id: `notif-${Date.now()}`,
      userId: proposal.creatorId,
      type: "CUSTOM_PROPOSAL_ACCEPTED",
      title: "Proposta aceita",
      body: "Sua proposta foi aceita. Assim que o pagamento for confirmado, você pode iniciar a produção.",
      linkHref: `/dashboard/pedidos-personalizados/${request.id}`,
      read: false,
      createdAt: now,
    });

    return { ...proposal, status: "accepted", updatedAt: now, acceptedAt: now };
  }

  reject(actingUserId: string, proposalId: string): CustomProposal {
    const proposal = this.proposalRepo.findById(proposalId);
    if (!proposal) throw new Error("Proposta não encontrada.");
    if (proposal.requesterId !== actingUserId) {
      throw new Error("Só o solicitante pode recusar esta proposta.");
    }
    if (proposal.status !== "sent") {
      throw new Error("Esta proposta não está mais disponível.");
    }

    const request = this.customRequestRepo.findById(proposal.customRequestId);
    if (!request) throw new Error("Pedido não encontrado.");

    const now = new Date().toISOString();
    this.proposalRepo.update(proposal.id, { status: "rejected", updatedAt: now, rejectedAt: now });
    this.customRequestRepo.update(request.id, { status: "negotiating", updatedAt: now });

    this.messageRepo.create({
      id: `msg-${Date.now()}`,
      conversationId: request.conversationId,
      senderId: actingUserId,
      type: "system",
      content: "Proposta recusada.",
      createdAt: now,
      metadata: { proposalId: proposal.id },
    });
    this.conversationRepo.update(request.conversationId, { updatedAt: now, lastMessageAt: now });

    this.notificationRepo.create({
      id: `notif-${Date.now()}`,
      userId: proposal.creatorId,
      type: "CUSTOM_PROPOSAL_REJECTED",
      title: "Proposta recusada",
      body: "O comprador recusou sua proposta. Vocês podem continuar negociando na conversa.",
      linkHref: `/dashboard/pedidos-personalizados/${request.id}`,
      read: false,
      createdAt: now,
    });

    return { ...proposal, status: "rejected", updatedAt: now, rejectedAt: now };
  }
}
