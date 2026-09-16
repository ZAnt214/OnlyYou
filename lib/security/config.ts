/**
 * Configuração de divisão de receita da plataforma.
 * Este é o único lugar em que os percentuais de repasse devem ser definidos.
 * Nenhum outro módulo deve hardcodar esses valores.
 */
export const platformConfig = {
  creatorRevenueShare: 0.8,
  platformRevenueShare: 0.2,
} as const;
