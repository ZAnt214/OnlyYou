export type ProductType =
  | "photo"
  | "video"
  | "digital_pack"
  | "art"
  | "design"
  | "music"
  | "gaming"
  | "tutorial"
  | "education"
  | "ebook"
  | "template"
  | "exclusive"
  | "custom_service"
  | "consulting"
  | "other";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  photo: "Fotos",
  video: "Vídeos",
  digital_pack: "Packs digitais",
  art: "Arte",
  design: "Design",
  music: "Música",
  gaming: "Gaming",
  tutorial: "Tutoriais",
  education: "Educação",
  ebook: "E-books",
  template: "Templates",
  exclusive: "Conteúdo exclusivo",
  custom_service: "Serviços personalizados",
  consulting: "Consultorias",
  other: "Outros",
};

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
