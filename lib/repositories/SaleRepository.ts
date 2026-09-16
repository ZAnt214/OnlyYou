"use client";

import { useMemo } from "react";
import type { Sale } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface SaleRepository {
  findAll(): Sale[];
  findByCreator(creatorId: string): Sale[];
  findByOrder(orderId: string): Sale | null;
  create(sale: Sale): void;
}

export class MockSaleRepository implements SaleRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): Sale[] {
    return this.session.sales;
  }

  findByCreator(creatorId: string): Sale[] {
    return this.session.sales.filter((s) => s.creatorId === creatorId);
  }

  findByOrder(orderId: string): Sale | null {
    return this.session.sales.find((s) => s.orderId === orderId) ?? null;
  }

  create(sale: Sale): void {
    this.session.addSale(sale);
  }
}

export function useSaleRepository(): SaleRepository {
  const session = useMockSession();
  return useMemo(() => new MockSaleRepository(session), [session]);
}
