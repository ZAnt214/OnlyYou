"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import { useCustomOrderServices } from "@/lib/services/useCustomOrderServices";

export function NotificationBell() {
  const session = useMockSession();
  const { notificationService } = useCustomOrderServices();
  const unread = notificationService.unreadCount(session.currentUserId);

  return (
    <Link
      href="/notificacoes"
      className="relative flex h-8 w-8 items-center justify-center rounded-md text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text)"
      aria-label={unread > 0 ? `Notificações (${unread} não lidas)` : "Notificações"}
    >
      <Bell size={16} strokeWidth={1.5} />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-accent) px-1 text-[10px] font-medium text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
