"use client";

import { useMemo } from "react";
import type { CustomProposal } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface CustomProposalRepository {
  findAll(): CustomProposal[];
  findById(id: string): CustomProposal | null;
  findByCustomRequest(customRequestId: string): CustomProposal[];
  create(proposal: CustomProposal): void;
  update(id: string, patch: Partial<CustomProposal>): void;
}

export class MockCustomProposalRepository implements CustomProposalRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): CustomProposal[] {
    return this.session.customProposals;
  }

  findById(id: string): CustomProposal | null {
    return this.session.customProposals.find((p) => p.id === id) ?? null;
  }

  findByCustomRequest(customRequestId: string): CustomProposal[] {
    return this.session.customProposals.filter((p) => p.customRequestId === customRequestId);
  }

  create(proposal: CustomProposal): void {
    this.session.addCustomProposal(proposal);
  }

  update(id: string, patch: Partial<CustomProposal>): void {
    this.session.updateCustomProposal(id, patch);
  }
}

export function useCustomProposalRepository(): CustomProposalRepository {
  const session = useMockSession();
  return useMemo(() => new MockCustomProposalRepository(session), [session]);
}
