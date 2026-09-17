"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { listNotificationsForUser } from "@/lib/supabase/customRequests";

export function NotificationBell() {
  const { userId } = useCurrentUserId();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    listNotificationsForUser(supabase, userId)
      .then((notifications) => setUnread(notifications.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, [userId]);

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
