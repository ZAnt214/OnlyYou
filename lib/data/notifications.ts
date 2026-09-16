import type { Notification } from "@/lib/types";

export const notifications: Notification[] = [
  {
    id: "notif-1",
    userId: "user-c02",
    type: "CUSTOM_REQUEST_CREATED",
    title: "Novo pedido personalizado",
    body: "Thiago Alves te enviou um pedido de conteúdo personalizado.",
    linkHref: "/dashboard/pedidos-personalizados/cr-1",
    read: false,
    createdAt: "2025-09-12T19:30:00.000Z",
  },
  {
    id: "notif-2",
    userId: "user-c01",
    type: "CUSTOM_PAYMENT_CONFIRMED",
    title: "Pagamento confirmado",
    body: "O pagamento do pedido de Rafa Lima foi confirmado. Você já pode iniciar a produção.",
    linkHref: "/dashboard/pedidos-personalizados/cr-2",
    read: true,
    createdAt: "2025-09-09T15:40:00.000Z",
  },
  {
    id: "notif-3",
    userId: "user-b01",
    type: "CUSTOM_SERVICE_STARTED",
    title: "Serviço iniciado",
    body: "Seu pagamento foi confirmado e Ana Rubi já pode começar a produzir seu conteúdo.",
    linkHref: "/pedidos/cr-2",
    read: true,
    createdAt: "2025-09-09T15:40:00.000Z",
  },
  {
    id: "notif-4",
    userId: "user-b03",
    type: "CUSTOM_DELIVERY_SENT",
    title: "Conteúdo entregue",
    body: "Helena Rosa entregou o conteúdo do seu pedido personalizado.",
    linkHref: "/pedidos/cr-3",
    read: true,
    createdAt: "2025-08-30T18:00:00.000Z",
  },
];
