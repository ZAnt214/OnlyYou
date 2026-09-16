"use client";

import { useMemo } from "react";
import type { Entitlement } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface EntitlementRepository {
  findAll(): Entitlement[];
  findByUser(userId: string): Entitlement[];
  findByUserAndProduct(userId: string, productId: string): Entitlement | null;
  create(entitlement: Entitlement): void;
  revoke(id: string): void;
}

export class MockEntitlementRepository implements EntitlementRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): Entitlement[] {
    return this.session.entitlements;
  }

  findByUser(userId: string): Entitlement[] {
    return this.session.entitlements.filter((e) => e.userId === userId);
  }

  findByUserAndProduct(userId: string, productId: string): Entitlement | null {
    return (
      this.session.entitlements.find((e) => e.userId === userId && e.productId === productId) ??
      null
    );
  }

  create(entitlement: Entitlement): void {
    this.session.addEntitlement(entitlement);
  }

  revoke(id: string): void {
    this.session.updateEntitlement(id, { status: "revoked" });
  }
}

export function useEntitlementRepository(): EntitlementRepository {
  const session = useMockSession();
  return useMemo(() => new MockEntitlementRepository(session), [session]);
}
