"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { listNotificationsForUser, markNotificationRead } from "@/lib/supabase/customRequests";
import type { Notification } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  CUSTOM_REQUEST_CREATED: "Novo pedido",
  CUSTOM_MESSAGE_RECEIVED: "Nova mensagem",
  CUSTOM_PROPOSAL_SENT: "Proposta recebida",
  CUSTOM_PROPOSAL_ACCEPTED: "Proposta aceita",
  CUSTOM_PROPOSAL_REJECTED: "Proposta recusada",
  CUSTOM_PAYMENT_CONFIRMED: "Pagamento confirmado",
  CUSTOM_SERVICE_STARTED: "Serviço iniciado",
  CUSTOM_DELIVERY_SENT: "Entrega enviada",
  CUSTOM_SERVICE_COMPLETED: "Pedido concluído",
  CUSTOM_SERVICE_EXPIRED: "Pedido expirado",
  CUSTOM_REFUND_CREATED: "Reembolso registrado",
  CUSTOM_DISPUTE_CREATED: "Problema relatado",
};

export default function NotificacoesPage() {
  const { userId, loading: loadingUser } = useCurrentUserId();
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    listNotificationsForUser(supabase, userId).then(setNotifications);
  }, [userId]);

  async function handleMarkRead(id: string) {
    const supabase = createClient();
    await markNotificationRead(supabase, id);
    setNotifications((prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-2">
        <Bell size={18} strokeWidth={1.5} className="text-(--color-text-muted)" />
        <h1 className="text-xl font-semibold text-(--color-text)">Notificações</h1>
      </div>

      {loadingUser ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-(--color-text-muted)">
          <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
          Carregando…
        </div>
      ) : !userId ? (
        <p className="text-sm text-(--color-text-muted)">
          <Link href="/entrar" className="text-(--color-accent) hover:underline">
            Entre na sua conta
          </Link>{" "}
          para ver suas notificações.
        </p>
      ) : notifications === null ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-(--color-text-muted)">
          <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
          Carregando…
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">Nenhuma notificação ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex flex-col gap-1 rounded-md border px-4 py-3 text-sm ${
                n.read
                  ? "border-(--color-border) text-(--color-text-muted)"
                  : "border-(--color-accent) bg-(--color-surface) text-(--color-text)"
              }`}
            >
              <span className="text-xs uppercase tracking-wide text-(--color-text-subtle)">
                {TYPE_LABELS[n.type] ?? n.type}
              </span>
              <span className="font-medium">{n.title}</span>
              <span className="text-(--color-text-muted)">{n.body}</span>
              <div className="mt-1 flex items-center gap-3">
                {n.linkHref ? (
                  <Link
                    href={n.linkHref}
                    onClick={() => handleMarkRead(n.id)}
                    className="w-fit text-xs font-medium text-(--color-accent) hover:underline"
                  >
                    Ver pedido
                  </Link>
                ) : null}
                {!n.read ? (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs text-(--color-text-subtle) hover:text-(--color-text)"
                  >
                    Marcar como lida
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
