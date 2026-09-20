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
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-surface-2) text-(--color-text-muted) transition-colors hover:text-(--color-text) md:h-9 md:w-9"
      aria-label={unread > 0 ? `Notificações (${unread} não lidas)` : "Notificações"}
    >
      <Bell size={18} strokeWidth={1.5} />
      {unread > 0 ? (
        <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-(--color-surface) bg-(--color-accent)" />
      ) : null}
    </Link>
  );
}
