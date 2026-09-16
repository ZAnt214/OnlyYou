"use client";

import { useMemo } from "react";
import type { Order } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface OrderRepository {
  findAll(): Order[];
  findById(id: string): Order | null;
  findByBuyer(buyerId: string): Order[];
  create(order: Order): void;
  updateStatus(id: string, status: Order["status"]): void;
}

/**
 * Implementação mock que opera sobre o estado da sessão de mock (mantido em
 * MockSessionProvider/localStorage). Nunca acessa localStorage diretamente —
 * apenas lê e escreve através das funções expostas por useMockSession().
 */
export class MockOrderRepository implements OrderRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): Order[] {
    return this.session.orders;
  }

  findById(id: string): Order | null {
    return this.session.orders.find((o) => o.id === id) ?? null;
  }

  findByBuyer(buyerId: string): Order[] {
    return this.session.orders.filter((o) => o.buyerId === buyerId);
  }

  create(order: Order): void {
    this.session.addOrder(order);
  }

  updateStatus(id: string, status: Order["status"]): void {
    this.session.updateOrder(id, { status });
  }
}

export function useOrderRepository(): OrderRepository {
  const session = useMockSession();
  return useMemo(() => new MockOrderRepository(session), [session]);
}
