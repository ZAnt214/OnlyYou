import { orders as seedOrders } from "@/lib/data/orders";
import { sales as seedSales } from "@/lib/data/sales";

export interface AdminStatsRepository {
  countOrders(): Promise<number>;
  totalGrossRevenue(): Promise<number>;
}

/**
 * Skeleton de estatísticas administrativas. Nesta fase de mock, lê os
 * fixtures semente (não reflete pedidos/vendas criados durante a sessão do
 * navegador) — suficiente para uma visão geral ilustrativa do admin.
 */
export class MockAdminStatsRepository implements AdminStatsRepository {
  async countOrders(): Promise<number> {
    return seedOrders.length;
  }

  async totalGrossRevenue(): Promise<number> {
    return seedSales.reduce((sum, s) => sum + s.grossAmount, 0);
  }
}

export const adminStatsRepository = new MockAdminStatsRepository();
