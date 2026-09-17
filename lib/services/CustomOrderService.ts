import type { CustomServiceOrder, Order, PaymentMethod } from "@/lib/types";
import type { CustomServiceOrderRepository } from "@/lib/repositories/CustomServiceOrderRepository";
import type { CustomProposalRepository } from "@/lib/repositories/CustomProposalRepository";
import type { CustomRequestRepository } from "@/lib/repositories/CustomRequestRepository";
import type { ConversationRepository } from "@/lib/repositories/ConversationRepository";
import type { MessageRepository } from "@/lib/repositories/MessageRepository";
import type { NotificationRepository } from "@/lib/repositories/NotificationRepository";
import type { OrderService } from "@/lib/services/OrderService";
import type { PaymentService } from "@/lib/services/PaymentService";
import type { WalletService } from "@/lib/services/WalletService";
import { auditLogRepository } from "@/lib/security/AuditLogRepository";

/**
 * Orquestra a contratação de um serviço personalizado a partir de uma
 * proposta aceita, reaproveitando OrderService/PaymentService/WalletService
 * — a mesma infraestrutura de checkout do marketplace (Order -> Payment ->
 * Sale), em vez de um sistema de pagamento paralelo.
 */
export class CustomOrderService {
  constructor(
    private customServiceOrderRepo: CustomServiceOrderRepository,
    private proposalRepo: CustomProposalRepository,
    private customRequestRepo: CustomRequestRepository,
    private conversationRepo: ConversationRepository,
    private messageRepo: MessageRepository,
    private notificationRepo: NotificationRepository,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private walletService: WalletService,
  ) {}

  /**
   * Cria o Order + Payment (status pending) para uma proposta aceita.
   * Idempotente: se já existe um CustomServiceOrder para esta proposta,
   * retorna o existente em vez de duplicar Order/Payment.
   */
  async createOrderAndPayment(
    actingUserId: string,
    proposalId: string,
    method: PaymentMethod,
  ): Promise<CustomServiceOrder> {
    const proposal = this.proposalRepo.findById(proposalId);
    if (!proposal) throw new Error("Proposta não encontrada.");
    if (proposal.requesterId !== actingUserId) {
      throw new Error("Só o solicitante pode pagar esta proposta.");
    }
    if (proposal.status !== "accepted") {
      throw new Error("A proposta precisa estar aceita antes do pagamento.");
    }

    const existing = this.customServiceOrderRepo.findByProposal(proposalId);
    if (existing) return existing;

    const order = this.orderService.createOrderForCustomProposal(actingUserId, proposal);
    const payment = await this.paymentService.startCustomServiceCheckout(order, method, proposal.creatorId);

    const customServiceOrder: CustomServiceOrder = {
      id: `cso-${Date.now()}`,
      customRequestId: proposal.customRequestId,
      proposalId: proposal.id,
      orderId: order.id,
      paymentId: payment.id,
      requesterId: proposal.requesterId,
      creatorId: proposal.creatorId,
      serviceType: proposal.serviceType,
      description: proposal.description,
      agreedAmountCents: proposal.priceCents,
      currency: "BRL",
      // Prazo definitivo só é fixado quando o pagamento é confirmado
      // (confirmPaymentAndStart) — até lá guardamos apenas um placeholder
      // baseado em deliveryDays a partir de agora.
      deliveryDeadlineAt: new Date(
        Date.now() + proposal.deliveryDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: "awaiting_payment",
      createdAt: new Date().toISOString(),
    };
    this.customServiceOrderRepo.create(customServiceOrder);

    return customServiceOrder;
  }

  /**
   * Equivalente ao "Simular confirmação do pagamento" do checkout de
   * produto (ver CheckoutFlow.tsx) — confirma o Payment, registra a Sale
   * via WalletService (aplicando platformConfig) e avança o pedido
   * personalizado para "in_progress". Idempotente: se o pedido já não está
   * mais em "awaiting_payment", não duplica Sale/notificações.
   */
  confirmPaymentAndStart(actingUserId: string, customServiceOrderId: string): CustomServiceOrder {
    const cso = this.customServiceOrderRepo.findById(customServiceOrderId);
    if (!cso) throw new Error("Pedido não encontrado.");
    if (cso.requesterId !== actingUserId) {
      throw new Error("Só o solicitante pode confirmar este pagamento.");
    }
    if (cso.status !== "awaiting_payment") {
      // Já processado — não repete a transição (evita Sale duplicada).
      return cso;
    }
    if (!cso.paymentId) throw new Error("Pedido sem pagamento associado.");

    const confirmedPayment = this.paymentService.confirmPayment(cso.paymentId);
    this.orderService.markPaid(cso.orderId);

    // WalletService precisa apenas de order.items[0] e payment — recompomos
    // o snapshot mínimo necessário sem duplicar toda a leitura de Order.
    const order: Order = {
      id: cso.orderId,
      buyerId: cso.requesterId,
      items: [
        {
          productId: cso.proposalId,
          productTitle: `${cso.serviceType} — pedido personalizado`,
          creatorId: cso.creatorId,
          unitPrice: cso.agreedAmountCents / 100,
          quantity: 1,
          subtotal: cso.agreedAmountCents / 100,
        },
      ],
      total: cso.agreedAmountCents / 100,
      currency: "BRL",
      status: "paid",
      createdAt: cso.createdAt,
    };
    this.walletService.registerSaleFromPayment(order, confirmedPayment);

    const proposal = this.proposalRepo.findById(cso.proposalId);
    const now = new Date().toISOString();
    const deliveryDeadlineAt = proposal
      ? new Date(Date.now() + proposal.deliveryDays * 24 * 60 * 60 * 1000).toISOString()
      : cso.deliveryDeadlineAt;

    this.customServiceOrderRepo.update(cso.id, {
      status: "in_progress",
      startedAt: now,
      deliveryDeadlineAt,
    });
    if (proposal) {
      this.proposalRepo.update(proposal.id, { deliveryDeadlineAt });
    }
    this.customRequestRepo.update(cso.customRequestId, { status: "in_progress", updatedAt: now });

    const conversation = this.conversationRepo.findByCustomRequest(cso.customRequestId);
    if (conversation) {
      this.messageRepo.create({
        id: `msg-${Date.now()}`,
        conversationId: conversation.id,
        senderId: cso.requesterId,
        type: "system",
        content: "Pagamento confirmado. Pedido em produção.",
        createdAt: now,
        metadata: { customServiceOrderId: cso.id },
      });
      this.conversationRepo.update(conversation.id, { updatedAt: now, lastMessageAt: now });
    }

    this.notificationRepo.create({
      id: `notif-${Date.now()}-a`,
      userId: cso.creatorId,
      type: "CUSTOM_PAYMENT_CONFIRMED",
      title: "Pagamento confirmado",
      body: "O pagamento foi confirmado. Você já pode iniciar a produção deste pedido.",
      linkHref: `/dashboard/pedidos-personalizados/${cso.customRequestId}`,
      read: false,
      createdAt: now,
    });
    this.notificationRepo.create({
      id: `notif-${Date.now()}-b`,
      userId: cso.requesterId,
      type: "CUSTOM_SERVICE_STARTED",
      title: "Serviço iniciado",
      body: "Seu pagamento foi confirmado e a produção do seu pedido já começou.",
      linkHref: `/pedidos/${cso.customRequestId}`,
      read: false,
      createdAt: now,
    });

    void auditLogRepository.append({
      id: `audit-${Date.now()}`,
      actorId: cso.requesterId,
      action: "custom_order.paid",
      entityType: "custom_service_order",
      entityId: cso.id,
      metadata: { amountCents: cso.agreedAmountCents },
      createdAt: now,
    });

    return { ...cso, status: "in_progress", startedAt: now, deliveryDeadlineAt };
  }
}
