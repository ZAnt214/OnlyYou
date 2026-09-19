/**
 * Avaliação mútua (1-5 estrelas + comentário) entre comprador e criador ao
 * final de um pedido personalizado. Uma linha por (pedido, autor) — ver
 * submit_custom_order_review (migração custom_order_reviews).
 */
export interface CustomOrderReview {
  id: string;
  customServiceOrderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/** Avaliação recebida, com o nome de quem avaliou — para exibição pública no perfil. */
export interface CustomOrderReviewWithReviewer extends CustomOrderReview {
  reviewerName: string;
}
