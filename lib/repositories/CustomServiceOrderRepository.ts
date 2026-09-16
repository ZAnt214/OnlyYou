"use client";

import { useMemo } from "react";
import type { CustomServiceOrder } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface CustomServiceOrderRepository {
  findAll(): CustomServiceOrder[];
  findById(id: string): CustomServiceOrder | null;
  findByCustomRequest(customRequestId: string): CustomServiceOrder | null;
  findByProposal(proposalId: string): CustomServiceOrder | null;
  create(order: CustomServiceOrder): void;
  update(id: string, patch: Partial<CustomServiceOrder>): void;
}

export class MockCustomServiceOrderRepository implements CustomServiceOrderRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): CustomServiceOrder[] {
    return this.session.customServiceOrders;
  }

  findById(id: string): CustomServiceOrder | null {
    return this.session.customServiceOrders.find((o) => o.id === id) ?? null;
  }

  findByCustomRequest(customRequestId: string): CustomServiceOrder | null {
    return this.session.customServiceOrders.find((o) => o.customRequestId === customRequestId) ?? null;
  }

  findByProposal(proposalId: string): CustomServiceOrder | null {
    return this.session.customServiceOrders.find((o) => o.proposalId === proposalId) ?? null;
  }

  create(order: CustomServiceOrder): void {
    this.session.addCustomServiceOrder(order);
  }

  update(id: string, patch: Partial<CustomServiceOrder>): void {
    this.session.updateCustomServiceOrder(id, patch);
  }
}

export function useCustomServiceOrderRepository(): CustomServiceOrderRepository {
  const session = useMockSession();
  return useMemo(() => new MockCustomServiceOrderRepository(session), [session]);
}
