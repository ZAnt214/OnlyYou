"use client";

import { useMemo } from "react";
import type { Withdrawal } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface WithdrawalRepository {
  findAll(): Withdrawal[];
  findByCreator(creatorId: string): Withdrawal[];
  create(withdrawal: Withdrawal): void;
  updateStatus(id: string, status: Withdrawal["status"]): void;
}

export class MockWithdrawalRepository implements WithdrawalRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): Withdrawal[] {
    return this.session.withdrawals;
  }

  findByCreator(creatorId: string): Withdrawal[] {
    return this.session.withdrawals.filter((w) => w.creatorId === creatorId);
  }

  create(withdrawal: Withdrawal): void {
    this.session.addWithdrawal(withdrawal);
  }

  updateStatus(id: string, status: Withdrawal["status"]): void {
    this.session.updateWithdrawal(id, { status });
  }
}

export function useWithdrawalRepository(): WithdrawalRepository {
  const session = useMockSession();
  return useMemo(() => new MockWithdrawalRepository(session), [session]);
}
