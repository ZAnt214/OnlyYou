/**
 * Anúncio de serviço estilo "vou fazer X pra você" — publicado pelo
 * criador, aparece no feed inicial e na busca. Diferente de Produto (que
 * é comprado direto) e de Portfólio (trabalho já feito, sem preço): um
 * Gig é uma oferta de preço/prazo indicativos que o comprador solicita —
 * a solicitação abre um pedido personalizado (chat) onde os detalhes
 * finais são acertados antes do pagamento. Ver lib/supabase/gigs.ts.
 */
export type GigCategory =
  | "general"
  | "design"
  | "programacao"
  | "marketing"
  | "videos"
  | "redacao-e-copywriting"
  | "ui-ux"
  | "consultorias"
  | "assistente-virtual"
  | "elojob"
  | "play_together";

/** Categorias com campos especiais de jogo/elo/duração — ver create_gig/update_gig. */
export const GAMING_GIG_CATEGORIES: readonly GigCategory[] = ["elojob", "play_together"];

export const GIG_CATEGORY_LABELS: Record<GigCategory, string> = {
  general: "Serviço geral",
  design: "Design",
  programacao: "Programação",
  marketing: "Marketing",
  videos: "Vídeo",
  "redacao-e-copywriting": "Redação e copywriting",
  "ui-ux": "UI/UX",
  consultorias: "Consultoria",
  "assistente-virtual": "Assistente virtual",
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
  /** Imagens extras além da capa — mostradas na busca/feed como prévia do padrão de trabalho. */
  galleryUrls: string[];
  /** Quantas rodadas de ajuste estão incluídas no preço — undefined quando o criador não informou. */
  revisionCount?: number;
  /** O que está incluso no serviço — lista curta, uma linha por item. */
  includedItems: string[];
  status: "active" | "paused";
  position: number;
  createdAt: string;
}
