"use client";

import { useMemo } from "react";
import { useCustomRequestRepository } from "@/lib/repositories/CustomRequestRepository";
import { useConversationRepository } from "@/lib/repositories/ConversationRepository";
import { useMessageRepository } from "@/lib/repositories/MessageRepository";
import { useCustomProposalRepository } from "@/lib/repositories/CustomProposalRepository";
import { useCustomServiceOrderRepository } from "@/lib/repositories/CustomServiceOrderRepository";
import { useNotificationRepository } from "@/lib/repositories/NotificationRepository";
import { useOrderRepository } from "@/lib/repositories/OrderRepository";
import { usePaymentRepository } from "@/lib/repositories/PaymentRepository";
import { useSaleRepository } from "@/lib/repositories/SaleRepository";
import { CustomRequestService } from "./CustomRequestService";
import { ConversationService } from "./ConversationService";
import { MessageService } from "./MessageService";
import { ProposalService } from "./ProposalService";
import { CustomOrderService } from "./CustomOrderService";
import { CustomDeliveryService } from "./CustomDeliveryService";
import { NotificationService } from "./NotificationService";
import { OrderService } from "./OrderService";
import { PaymentService } from "./PaymentService";
import { WalletService } from "./WalletService";

/**
 * Reúne os serviços do fluxo de pedidos personalizados
 * (CustomRequest -> Conversation/Message -> CustomProposal -> CustomServiceOrder
 * -> Order/Payment/Sale -> entrega), todos ligados aos repositórios
 * session-backed (sobrevivem a reload via MockSessionProvider/localStorage).
 * Mirror de useCheckoutServices.ts.
 */
export function useCustomOrderServices() {
  const customRequestRepo = useCustomRequestRepository();
  const conversationRepo = useConversationRepository();
  const messageRepo = useMessageRepository();
  const proposalRepo = useCustomProposalRepository();
  const customServiceOrderRepo = useCustomServiceOrderRepository();
  const notificationRepo = useNotificationRepository();
  const orderRepo = useOrderRepository();
  const paymentRepo = usePaymentRepository();
  const saleRepo = useSaleRepository();

  return useMemo(() => {
    const orderService = new OrderService(orderRepo);
    const paymentService = new PaymentService(paymentRepo);
    const walletService = new WalletService(saleRepo);

    return {
      customRequestService: new CustomRequestService(
        customRequestRepo,
        conversationRepo,
        messageRepo,
        notificationRepo,
      ),
      conversationService: new ConversationService(conversationRepo, messageRepo, customRequestRepo),
      messageService: new MessageService(messageRepo, conversationRepo, customRequestRepo, notificationRepo),
      proposalService: new ProposalService(
        proposalRepo,
        customRequestRepo,
        conversationRepo,
        messageRepo,
        notificationRepo,
      ),
      customOrderService: new CustomOrderService(
        customServiceOrderRepo,
        proposalRepo,
        customRequestRepo,
        conversationRepo,
        messageRepo,
        notificationRepo,
        orderService,
        paymentService,
        walletService,
      ),
      customDeliveryService: new CustomDeliveryService(
        customServiceOrderRepo,
        customRequestRepo,
        conversationRepo,
        messageRepo,
        notificationRepo,
      ),
      notificationService: new NotificationService(notificationRepo),
      paymentService,
      proposalRepo,
      customServiceOrderRepo,
    };
  }, [
    customRequestRepo,
    conversationRepo,
    messageRepo,
    proposalRepo,
    customServiceOrderRepo,
    notificationRepo,
    orderRepo,
    paymentRepo,
    saleRepo,
  ]);
}
