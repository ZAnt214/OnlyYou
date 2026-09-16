import type { Order } from "@/lib/types";

export const orders: Order[] = [
  {
    id: "order-1001",
    buyerId: "user-b01",
    items: [
      {
        productId: "prod-001",
        productTitle: "Pack Privado #07",
        creatorId: "user-c01",
        unitPrice: 39.9,
        quantity: 1,
        subtotal: 39.9,
      },
    ],
    total: 39.9,
    currency: "BRL",
    status: "paid",
    createdAt: "2025-09-01T14:20:00.000Z",
  },
  {
    id: "order-1002",
    buyerId: "user-b01",
    items: [
      {
        productId: "prod-003",
        productTitle: "Sessão Studio Vermelho",
        creatorId: "user-c02",
        unitPrice: 24.9,
        quantity: 1,
        subtotal: 24.9,
      },
    ],
    total: 24.9,
    currency: "BRL",
    status: "paid",
    createdAt: "2025-09-05T09:10:00.000Z",
  },
  {
    id: "order-1003",
    buyerId: "user-b02",
    items: [
      {
        productId: "prod-009",
        productTitle: "Pack Outono — Edição Limitada",
        creatorId: "user-c05",
        unitPrice: 34.9,
        quantity: 1,
        subtotal: 34.9,
      },
    ],
    total: 34.9,
    currency: "BRL",
    status: "paid",
    createdAt: "2025-09-08T18:45:00.000Z",
  },
  {
    id: "order-1004",
    buyerId: "user-b02",
    items: [
      {
        productId: "prod-002",
        productTitle: "Ensaio Noturno — Vol. 2",
        creatorId: "user-c01",
        unitPrice: 44.9,
        quantity: 1,
        subtotal: 44.9,
      },
    ],
    total: 44.9,
    currency: "BRL",
    status: "pending",
    createdAt: "2025-09-14T11:05:00.000Z",
  },
  {
    id: "order-1005",
    buyerId: "user-b03",
    items: [
      {
        productId: "prod-004",
        productTitle: "Bundle Completo — Verão",
        creatorId: "user-c02",
        unitPrice: 99.9,
        quantity: 1,
        subtotal: 99.9,
      },
    ],
    total: 99.9,
    currency: "BRL",
    status: "refunded",
    createdAt: "2025-08-20T16:30:00.000Z",
  },
  {
    id: "order-1006",
    buyerId: "user-b03",
    items: [
      {
        productId: "prod-013",
        productTitle: "Ensaio Noturno — Vol. 1",
        creatorId: "user-c08",
        unitPrice: 54.9,
        quantity: 1,
        subtotal: 54.9,
      },
    ],
    total: 54.9,
    currency: "BRL",
    status: "cancelled",
    createdAt: "2025-09-11T20:00:00.000Z",
  },
  // Pedidos personalizados (custom requests) reaproveitam a mesma estrutura de
  // Order — o "produto" é o serviço combinado na proposta aceita (ver
  // lib/data/custom-service-orders.ts e lib/data/custom-proposals.ts).
  {
    id: "order-cso-2",
    buyerId: "user-b01",
    items: [
      {
        productId: "prop-2",
        productTitle: "Vídeo personalizado — Ana Rubi",
        creatorId: "user-c01",
        unitPrice: 200,
        quantity: 1,
        subtotal: 200,
      },
    ],
    total: 200,
    currency: "BRL",
    status: "paid",
    createdAt: "2025-09-09T14:00:00.000Z",
  },
  {
    id: "order-cso-3",
    buyerId: "user-b03",
    items: [
      {
        productId: "prop-3",
        productTitle: "Pack de fotos personalizado — Helena Rosa",
        creatorId: "user-c05",
        unitPrice: 350,
        quantity: 1,
        subtotal: 350,
      },
    ],
    total: 350,
    currency: "BRL",
    status: "paid",
    createdAt: "2025-08-26T09:00:00.000Z",
  },
];
