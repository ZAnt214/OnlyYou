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
  position: number;
  createdAt: string;
}
