export type ProductType = "photo" | "video" | "pack" | "bundle" | "custom" | "other";

export type ProductStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "removed";

export interface Product {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  type: ProductType;
  price: number;
  promoPrice?: number;
  coverImage: string;
  previewImages: string[];
  status: ProductStatus;
  rating: number;
  ratingCount: number;
  salesCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
}
