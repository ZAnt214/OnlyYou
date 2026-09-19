/**
 * Trabalho já realizado que o criador exibe no próprio perfil público —
 * diferente de Produtos (que são anúncios à venda). Ver migração
 * creator_portfolio_items.
 */
export interface PortfolioItem {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  externalUrl?: string;
  imageUrl?: string;
  /** Texto completo do trabalho, mostrado só quando o card é expandido. */
  content: string;
  /** Imagens extras do trabalho completo, além de `imageUrl` (capa). */
  galleryUrls: string[];
  position: number;
  createdAt: string;
}
