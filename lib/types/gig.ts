/**
 * Anúncio de serviço estilo "vou fazer X pra você" — publicado pelo
 * criador, aparece no feed inicial e na busca. Diferente de Produto (que
 * é comprado direto) e de Portfólio (trabalho já feito, sem preço): um
 * Gig é uma oferta de preço/prazo indicativos que o comprador solicita —
 * a solicitação abre um pedido personalizado (chat) onde os detalhes
 * finais são acertados antes do pagamento. Ver lib/supabase/gigs.ts.
 */
export type GigCategory = "general" | "elojob" | "play_together";

export const GIG_CATEGORY_LABELS: Record<GigCategory, string> = {
  general: "Serviço geral",
  elojob: "Elojob",
  play_together: "Jogue comigo",
};

export interface Gig {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: GigCategory;
  /** Jogo atendido nas categorias gamer. */
  game?: string;
  /** Plataforma, servidor ou região informada pelo profissional. */
  platform?: string;
  /** Duração da sessão de Jogue comigo, em minutos. */
  sessionMinutes?: number;
  /** Elo de partida e objetivo do serviço de Elojob. */
  currentRank?: string;
  targetRank?: string;
  /** Preço "a partir de", em centavos — o valor final é acertado na conversa. */
  priceCents: number;
  /** Prazo estimado de entrega, em dias — null quando não informado. */
  deliveryDays: number | null;
  coverImageUrl?: string;
  status: "active" | "paused";
  position: number;
  createdAt: string;
}
