import type { Notification } from "@/lib/types";
import type { NotificationRepository } from "@/lib/repositories/NotificationRepository";

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository) {}

  listForUser(userId: string): Notification[] {
    return this.notificationRepo.findByUser(userId);
  }

  unreadCount(userId: string): number {
    return this.notificationRepo.findByUser(userId).filter((n) => !n.read).length;
  }

  markRead(id: string): void {
    this.notificationRepo.markRead(id);
  }
}
