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
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-(--color-text-muted) transition-colors hover:bg-(--color-surface-2) hover:text-(--color-text)"
      aria-label={unread > 0 ? `Notificações (${unread} não lidas)` : "Notificações"}
    >
      <Bell size={18} strokeWidth={1.5} />
      {unread > 0 ? (
        <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-accent) px-1 text-[10px] font-medium leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
