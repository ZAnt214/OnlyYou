"use client";

import { useMemo } from "react";
import type { Payment } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface PaymentRepository {
  findAll(): Payment[];
  findById(id: string): Payment | null;
  findByOrder(orderId: string): Payment | null;
  create(payment: Payment): void;
  update(id: string, patch: Partial<Payment>): void;
}

export class MockPaymentRepository implements PaymentRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): Payment[] {
    return this.session.payments;
  }

  findById(id: string): Payment | null {
    return this.session.payments.find((p) => p.id === id) ?? null;
  }

  findByOrder(orderId: string): Payment | null {
    return this.session.payments.find((p) => p.orderId === orderId) ?? null;
  }

  create(payment: Payment): void {
    this.session.addPayment(payment);
  }

  update(id: string, patch: Partial<Payment>): void {
    this.session.updatePayment(id, patch);
  }
}

export function usePaymentRepository(): PaymentRepository {
  const session = useMockSession();
  return useMemo(() => new MockPaymentRepository(session), [session]);
}
