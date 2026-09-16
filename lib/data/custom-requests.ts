import type { CustomRequest } from "@/lib/types";

/**
 * Fixtures cobrindo os três estágios principais do fluxo, para que toda
 * tela tenha um exemplo populado sem precisar criar um pedido manualmente:
 * cr-1 (pending, sem proposta), cr-2 (in_progress, pago e em produção) e
 * cr-3 (completed, entregue e confirmado).
 */
export const customRequests: CustomRequest[] = [
  {
    id: "cr-1",
    requesterId: "user-b02",
    creatorId: "user-c02",
    description:
      "Gostaria de um ensaio temático de 10 fotos, estilo noturno, com roupa específica que posso descrever em mais detalhes.",
    status: "pending",
    conversationId: "conv-1",
    createdAt: "2025-09-12T19:30:00.000Z",
    updatedAt: "2025-09-12T19:30:00.000Z",
  },
  {
    id: "cr-2",
    requesterId: "user-b01",
    creatorId: "user-c01",
    description: "Vídeo curto personalizado (3-5 minutos) com um roteiro que vou enviar na conversa.",
    status: "in_progress",
    conversationId: "conv-2",
    createdAt: "2025-09-08T10:00:00.000Z",
    updatedAt: "2025-09-09T15:40:00.000Z",
    acceptedAt: "2025-09-09T14:00:00.000Z",
  },
  {
    id: "cr-3",
    requesterId: "user-b03",
    creatorId: "user-c05",
    description: "Pack de 15 fotos em cenário de estúdio, com direção de poses combinada por mensagem.",
    status: "completed",
    conversationId: "conv-3",
    createdAt: "2025-08-25T13:00:00.000Z",
    updatedAt: "2025-08-30T20:10:00.000Z",
    acceptedAt: "2025-08-26T09:00:00.000Z",
  },
];
