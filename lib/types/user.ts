export type Role = "buyer" | "creator" | "admin";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";

export interface CreatorProfile {
  bio: string;
  followers: number;
  verificationStatus: VerificationStatus;
  rating: number;
  ratingCount: number;
  productCount: number;
  /**
   * Tags selecionáveis de "O que ofereço", editadas em /dashboard/configuracoes.
   * Diferente das tags de produto (derivadas automaticamente dos produtos
   * publicados), estas são declaradas pelo próprio criador.
   */
  offerings?: string[];
  offeringsDescription?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  roles: Role[];
  createdAt: string;
  creatorProfile?: CreatorProfile;
}
