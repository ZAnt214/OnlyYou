"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, QrCode } from "lucide-react";

interface PixData {
  qrCode?: string;
  qrCodeBase64?: string;
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Pagamento Pix dentro da conversa: a pessoa informa o CPF (exigido pelo
 * Mercado Pago para Pix) e o QR code + copia-e-cola aparecem aqui mesmo —
 * sem formulário do Mercado Pago, sem redirecionamento e sem envio por
 * e-mail. O valor nunca sai daqui: o servidor resolve tudo pelo orderId.
 */
export function PixCheckoutPanel({ orderId, onPaid }: { orderId: string; onPaid: () => void }) {
  const [cpf, setCpf] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/mercadopago/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, cpf }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível gerar o Pix.");
      if (data.status === "paid") {
        onPaid();
        return;
      }
      setPix({ qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o Pix.");
    } finally {
      setGenerating(false);
    }
  }

  // Enquanto o Pix não é pago, o status real é consultado no servidor —
  // o navegador nunca decide sozinho que o pagamento caiu.
  useEffect(() => {
    if (!pix) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mercadopago/status?orderId=${encodeURIComponent(orderId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.paid) {
          clearInterval(interval);
          onPaid();
        }
      } catch {
        // Falha pontual de rede — a próxima tentativa resolve.
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pix, orderId, onPaid]);

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
            className="h-56 w-56 rounded-xl border border-(--color-border)"
          />
        ) : null}
        {pix.qrCode ? (
          <>
            <p className="w-full break-all rounded-xl bg-(--color-surface-2) px-3 py-2 text-center text-xs text-(--color-text-muted)">
              {pix.qrCode}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
            >
              {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
              {copied ? "Código copiado" : "Copiar código Pix"}
            </button>
          </>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-(--color-text-subtle)">
          <Loader2 size={14} className="animate-spin" strokeWidth={1.5} />
          Aguardando confirmação do pagamento…
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleGenerate}
      className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm"
    >
      <p className="text-sm font-medium text-(--color-text)">Pagar com Pix</p>
      <label className="flex flex-col gap-1 text-sm text-(--color-text)">
        CPF do pagador
        <input
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          inputMode="numeric"
          placeholder="000.000.000-00"
          required
          className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
        />
      </label>
      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
      <button
        type="submit"
        disabled={generating || cpf.replace(/\D/g, "").length !== 11}
        className="flex w-fit items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2 text-sm font-semibold text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
      >
        {generating ? (
          <Loader2 size={14} className="animate-spin" strokeWidth={1.5} />
        ) : (
          <QrCode size={14} strokeWidth={1.5} />
        )}
        Gerar código Pix
      </button>
    </form>
  );
}
