"use client";

import { useMemo } from "react";
import type { CustomRequest } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface CustomRequestRepository {
  findAll(): CustomRequest[];
  findById(id: string): CustomRequest | null;
  findByRequester(requesterId: string): CustomRequest[];
  findByCreator(creatorId: string): CustomRequest[];
  create(request: CustomRequest): void;
  update(id: string, patch: Partial<CustomRequest>): void;
}

/**
 * Substitui a versão anterior (repositório mock "plano", em memória de
 * processo) por uma implementação ligada ao MockSessionProvider — pedidos
 * personalizados precisam sobreviver a reload/navegação como qualquer outro
 * estado de fluxo de compra (Order, Payment, ...).
 */
export class MockCustomRequestRepository implements CustomRequestRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): CustomRequest[] {
    return this.session.customRequests;
  }

  findById(id: string): CustomRequest | null {
    return this.session.customRequests.find((r) => r.id === id) ?? null;
  }

  findByRequester(requesterId: string): CustomRequest[] {
    return this.session.customRequests.filter((r) => r.requesterId === requesterId);
  }

  findByCreator(creatorId: string): CustomRequest[] {
    return this.session.customRequests.filter((r) => r.creatorId === creatorId);
  }

  create(request: CustomRequest): void {
    this.session.addCustomRequest(request);
  }

  update(id: string, patch: Partial<CustomRequest>): void {
    this.session.updateCustomRequest(id, patch);
  }
}

export function useCustomRequestRepository(): CustomRequestRepository {
  const session = useMockSession();
  return useMemo(() => new MockCustomRequestRepository(session), [session]);
}
