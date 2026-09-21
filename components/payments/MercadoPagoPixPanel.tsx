"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import type { Payment } from "@/lib/types";

const POLL_INTERVAL_MS = 3000;

interface MercadoPagoPixPanelProps {
  payment: Payment;
  /** Só precisa saber consultar o status real — não depende mais de nenhum repositório mock. */
  paymentService: { syncStatus(orderId: string, mpPaymentIdHint?: string): Promise<Payment> };
  onPaid: (payment: Payment) => void;
}

/**
 * Painel de pagamento Pix (Mercado Pago): mostra o QR code / copia-e-cola e
 * faz polling do status real até o pagamento ser aprovado, disparando
 * onPaid(). Se o Payment tiver checkoutRedirectUrl (cartão/boleto via
 * Checkout Pro), mostra o botão de redirecionamento em vez do QR.
 */
export function MercadoPagoPixPanel({ payment, paymentService, onPaid }: MercadoPagoPixPanelProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  useEffect(() => {
    if (payment.status === "paid") return;
    let cancelled = false;

    const interval = setInterval(async () => {
      try {
        const updated = await paymentService.syncStatus(payment.orderId);
        if (cancelled) return;
        if (updated.status === "paid") {
          clearInterval(interval);
          onPaidRef.current(updated);
        }
      } catch {
        if (!cancelled) setError("Não foi possível verificar o status do pagamento agora.");
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [payment.id, payment.orderId, payment.status, paymentService]);

  async function handleCopy() {
    if (!payment.checkoutQrCode) return;
    await navigator.clipboard.writeText(payment.checkoutQrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (payment.checkoutRedirectUrl) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-(--color-text-muted)">
          Você será redirecionado ao ambiente seguro do Mercado Pago para concluir o pagamento.
        </p>
        <a
          href={payment.checkoutRedirectUrl}
          className="rounded-md bg-(--color-accent) px-4 py-2.5 text-center text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover)"
        >
          Pagar no Mercado Pago
        </a>
        {error ? <p className="text-xs text-(--color-danger)">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {payment.checkoutQrCodeBase64 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/png;base64,${payment.checkoutQrCodeBase64}`}
          alt="QR Code Pix"
          className="h-48 w-48 rounded-md border border-(--color-border)"
        />
      ) : null}

      {payment.checkoutQrCode ? (
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-md border border-(--color-border) px-3 py-2 text-xs text-(--color-text-muted) hover:text-(--color-text)"
        >
          {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
          {copied ? "Código copiado" : "Copiar código Pix"}
        </button>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-(--color-text-subtle)">
        <Loader2 size={14} className="animate-spin" strokeWidth={1.5} />
        Aguardando confirmação do pagamento...
      </div>

      {error ? <p className="text-xs text-(--color-danger)">{error}</p> : null}
    </div>
  );
}
