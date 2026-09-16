export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface OrderItem {
  productId: string;
  productTitle: string;
  creatorId: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  buyerId: string;
  items: OrderItem[];
  total: number;
  currency: "BRL";
  status: OrderStatus;
  createdAt: string;
}
