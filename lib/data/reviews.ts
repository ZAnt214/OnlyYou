import type { Review } from "@/lib/types";

export const reviews: Review[] = [
  {
    id: "rev-3001",
    productId: "prod-001",
    userId: "user-b01",
    orderId: "order-1001",
    rating: 5,
    comment: "Qualidade excelente, entrega imediata após confirmação do pagamento.",
    verifiedPurchase: true,
    createdAt: "2025-09-02T10:00:00.000Z",
  },
  {
    id: "rev-3002",
    productId: "prod-003",
    userId: "user-b01",
    orderId: "order-1002",
    rating: 4,
    comment: "Bom conteúdo, esperava mais fotos pelo preço.",
    verifiedPurchase: true,
    createdAt: "2025-09-06T10:00:00.000Z",
  },
  {
    id: "rev-3003",
    productId: "prod-009",
    userId: "user-b02",
    orderId: "order-1003",
    rating: 5,
    comment: "Melhor pack que já comprei na plataforma.",
    verifiedPurchase: true,
    createdAt: "2025-09-09T10:00:00.000Z",
  },
  {
    id: "rev-3004",
    productId: "prod-001",
    userId: "user-b03",
    orderId: "order-1001",
    rating: 5,
    comment: "Recomendo, criadora responde rápido.",
    verifiedPurchase: false,
    createdAt: "2025-09-03T10:00:00.000Z",
  },
];
