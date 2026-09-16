"use client";

import { useMemo } from "react";
import type { Conversation } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface ConversationRepository {
  findAll(): Conversation[];
  findById(id: string): Conversation | null;
  findByCustomRequest(customRequestId: string): Conversation | null;
  create(conversation: Conversation): void;
  update(id: string, patch: Partial<Conversation>): void;
}

export class MockConversationRepository implements ConversationRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): Conversation[] {
    return this.session.conversations;
  }

  findById(id: string): Conversation | null {
    return this.session.conversations.find((c) => c.id === id) ?? null;
  }

  findByCustomRequest(customRequestId: string): Conversation | null {
    return this.session.conversations.find((c) => c.customRequestId === customRequestId) ?? null;
  }

  create(conversation: Conversation): void {
    this.session.addConversation(conversation);
  }

  update(id: string, patch: Partial<Conversation>): void {
    this.session.updateConversation(id, patch);
  }
}

export function useConversationRepository(): ConversationRepository {
  const session = useMockSession();
  return useMemo(() => new MockConversationRepository(session), [session]);
}
