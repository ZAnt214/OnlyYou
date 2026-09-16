"use client";

import { useMemo } from "react";
import type { Message } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface MessageRepository {
  findAll(): Message[];
  findById(id: string): Message | null;
  findByConversation(conversationId: string): Message[];
  create(message: Message): void;
  update(id: string, patch: Partial<Message>): void;
}

export class MockMessageRepository implements MessageRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): Message[] {
    return this.session.messages;
  }

  findById(id: string): Message | null {
    return this.session.messages.find((m) => m.id === id) ?? null;
  }

  findByConversation(conversationId: string): Message[] {
    return this.session.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  create(message: Message): void {
    this.session.addMessage(message);
  }

  update(id: string, patch: Partial<Message>): void {
    this.session.updateMessage(id, patch);
  }
}

export function useMessageRepository(): MessageRepository {
  const session = useMockSession();
  return useMemo(() => new MockMessageRepository(session), [session]);
}
