"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDashed, AlertTriangle, XCircle } from "lucide-react";
import type { CreatorMercadoPagoStatus } from "@/lib/payments/creatorMercadoPagoAccount";

const STATUS_LABEL: Record<CreatorMercadoPagoStatus["status"], string> = {
  not_connected: "Mercado Pago não conectado",
  connected: "Mercado Pago conectado",
  error: "Erro na conexão",
  expired: "Conexão expirada — requer nova autorização",
};

export function MercadoPagoConnectionCard({
  status,
  oauthResult,
}: {
  status: CreatorMercadoPagoStatus;
  oauthResult?: string;
}) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/mercadopago/oauth/disconnect", { method: "POST" });
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  const icon =
    status.status === "connected" ? (
      <CheckCircle2 size={18} className="text-(--color-success)" strokeWidth={1.5} />
    ) : status.status === "expired" || status.status === "error" ? (
      <AlertTriangle size={18} className="text-(--color-warning)" strokeWidth={1.5} />
    ) : (
      <CircleDashed size={18} className="text-(--color-text-subtle)" strokeWidth={1.5} />
    );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
      {oauthResult === "error" ? (
        <div className="flex items-center gap-2 rounded-md border border-(--color-danger) bg-(--color-bg) p-3 text-sm text-(--color-danger)">
          <XCircle size={16} strokeWidth={1.5} />
          Não foi possível conectar sua conta do Mercado Pago. Tente novamente.
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-sm font-medium text-(--color-text)">
        {icon}
        {STATUS_LABEL[status.status]}
      </div>

      {status.connected ? (
        <div className="flex flex-col gap-1 text-sm text-(--color-text-muted)">
          {status.mpNickname ? (
            <p>
              Conta vinculada: <span className="text-(--color-text)">{status.mpNickname}</span>
            </p>
          ) : null}
          {status.connectedAt ? (
            <p>
              Conectado em{" "}
              <span className="text-(--color-text)">
                {new Date(status.connectedAt).toLocaleDateString("pt-BR")}
              </span>
            </p>
          ) : null}
          <p>Modo: {status.liveMode ? "produção" : "teste (sandbox)"}</p>
        </div>
      ) : (
        <p className="text-sm text-(--color-text-muted)">
          Sem uma conta Mercado Pago conectada, seus produtos não podem ser vendidos.
        </p>
      )}

      <div className="flex gap-2">
        <a
          href="/api/mercadopago/oauth/authorize"
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          {status.connected ? "Reconectar Mercado Pago" : "Conectar Mercado Pago"}
        </a>
        {status.connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="rounded-md border border-(--color-border) px-4 py-2 text-sm text-(--color-text) hover:bg-(--color-bg) disabled:opacity-60"
          >
            {disconnecting ? "Desconectando…" : "Desconectar"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
