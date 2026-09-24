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
  /** Imagem de destaque horizontal do perfil do criador. */
  cover?: string;
  /**
   * Tags selecionáveis de "O que ofereço", editadas em /dashboard/configuracoes.
   * Diferente das tags de produto (derivadas automaticamente dos produtos
   * publicados), estas são declaradas pelo próprio criador.
   */
  offerings?: string[];
  offeringsDescription?: string;
  /** Habilidades/skills declaradas pelo criador — tags livres, sem categoria fixa. */
  skills?: string[];
  /** Idiomas que o criador fala, parte do currículo. Texto livre por item (ex.: "Inglês (avançado)"). */
  languages?: string[];
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
