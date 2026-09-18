"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

const MP_SDK_URL = "https://sdk.mercadopago.com/js/v2";

interface BrickController {
  unmount: () => void;
}

interface MercadoPagoBricks {
  create: (
    brick: "payment",
    containerId: string,
    settings: Record<string, unknown>,
  ) => Promise<BrickController>;
}

interface MercadoPagoInstance {
  bricks: () => MercadoPagoBricks;
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadMercadoPagoSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${MP_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("SDK do Mercado Pago indisponível.")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = MP_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o Mercado Pago."));
    document.body.appendChild(script);
  });

  return sdkPromise;
}

interface PixResult {
  qrCode?: string;
  qrCodeBase64?: string;
}

/**
 * Formulário oficial do Mercado Pago (Payment Brick) renderizado dentro da
 * conversa. É o Brick que coleta os dados reais do pagador (e-mail, CPF) —
 * exigência do Mercado Pago para criar um Pix em conta de produção. O valor
 * cobrado nunca sai daqui: o servidor resolve tudo pelo orderId (ver
 * app/api/mercadopago/process-payment/route.ts).
 */
export function MercadoPagoPaymentBrick({
  orderId,
  onPaid,
}: {
  orderId: string;
  onPaid: () => void;
}) {
  const containerId = `mp-brick-${orderId}`;
  const controllerRef = useRef<BrickController | null>(null);
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      try {
        const sessionRes = await fetch("/api/mercadopago/brick-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const session = await sessionRes.json();
        if (!sessionRes.ok) throw new Error(session.error ?? "Não foi possível preparar o pagamento.");
        if (cancelled) return;

        await loadMercadoPagoSdk();
        if (cancelled || !window.MercadoPago) return;

        const mp = new window.MercadoPago(session.publicKey, { locale: "pt-BR" });
        const controller = await mp.bricks().create("payment", containerId, {
          initialization: {
            amount: session.amount,
            preferenceId: session.preferenceId,
          },
          customization: {
            paymentMethods: { bankTransfer: "all", creditCard: "all", ticket: [] },
            visual: { hideFormTitle: true },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setLoading(false);
            },
            onSubmit: ({ formData }: { formData: Record<string, unknown> }) =>
              new Promise<void>((resolve, reject) => {
                fetch("/api/mercadopago/process-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId, formData }),
                })
                  .then(async (res) => {
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data.error ?? "Pagamento recusado.");
                    if (data.qrCode || data.qrCodeBase64) {
                      setPix({ qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 });
                    }
                    if (data.status === "paid") onPaidRef.current();
                    resolve();
                  })
                  .catch((err: unknown) => {
                    const message = err instanceof Error ? err.message : "Erro ao processar pagamento.";
                    setError(message);
                    reject(err instanceof Error ? err : new Error(message));
                  });
              }),
            onError: (err: { message?: string }) => {
              if (!cancelled) {
                setLoading(false);
                setError(err?.message ?? "Erro no formulário de pagamento.");
              }
            },
          },
        });

        if (cancelled) {
          controller.unmount();
          return;
        }
        controllerRef.current = controller;
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          setError(err instanceof Error ? err.message : "Não foi possível carregar o pagamento.");
        }
      }
    }

    void mount();
    return () => {
      cancelled = true;
      try {
        controllerRef.current?.unmount();
      } catch {
        // Brick já desmontado — nada a fazer.
      }
      controllerRef.current = null;
    };
  }, [orderId, containerId]);

  // Enquanto o Pix não é pago, consulta o status real no servidor (nunca
  // confia no navegador para dizer que pagou).
  useEffect(() => {
    if (!pix) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mercadopago/status?orderId=${encodeURIComponent(orderId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.paid) {
          clearInterval(interval);
          onPaidRef.current();
        }
      } catch {
        // Falha de rede pontual — a próxima tentativa resolve.
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pix, orderId]);

  async function handleCopy() {
    if (!pix?.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (pix) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
        <p className="text-sm font-medium text-(--color-text)">Pague com Pix para iniciar o serviço</p>
        {pix.qrCodeBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR Code Pix"
            className="h-52 w-52 rounded-xl border border-(--color-border)"
          />
        ) : null}
        {pix.qrCode ? (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-full border border-(--color-border) px-4 py-2 text-xs text-(--color-text-muted) hover:text-(--color-text)"
          >
            {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
            {copied ? "Código copiado" : "Copiar código Pix"}
          </button>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-(--color-text-subtle)">
          <Loader2 size={14} className="animate-spin" strokeWidth={1.5} />
          Aguardando confirmação do pagamento…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-(--color-text-muted)">
          <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
          Carregando formulário de pagamento…
        </div>
      ) : null}
      <div id={containerId} />
      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
    </div>
  );
}
