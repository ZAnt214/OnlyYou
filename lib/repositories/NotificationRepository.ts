"use client";

import { useMemo } from "react";
import type { Notification } from "@/lib/types";
import { useMockSession, type MockSessionContextValue } from "@/lib/mock-session/MockSessionProvider";

export interface NotificationRepository {
  findAll(): Notification[];
  findByUser(userId: string): Notification[];
  create(notification: Notification): void;
  markRead(id: string): void;
}

export class MockNotificationRepository implements NotificationRepository {
  constructor(private session: MockSessionContextValue) {}

  findAll(): Notification[] {
    return this.session.notifications;
  }

  findByUser(userId: string): Notification[] {
    return this.session.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  create(notification: Notification): void {
    this.session.addNotification(notification);
  }

  markRead(id: string): void {
    this.session.updateNotification(id, { read: true });
  }
}

export function useNotificationRepository(): NotificationRepository {
  const session = useMockSession();
  return useMemo(() => new MockNotificationRepository(session), [session]);
}
