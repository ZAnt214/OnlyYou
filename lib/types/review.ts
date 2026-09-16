export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}
