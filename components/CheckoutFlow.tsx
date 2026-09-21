"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, QrCode } from "lucide-react";
import type { Product, Payment, PaymentMethod } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { createProductOrder } from "@/lib/supabase/products";
import { PriceTag } from "@/components/PriceTag";
import { MercadoPagoPixPanel } from "@/components/payments/MercadoPagoPixPanel";

type Step = "review" | "pending" | "done";

interface CheckoutApiResult {
  paymentId: string;
  status: Payment["status"];
  redirectUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
}

/**
 * Checkout de produto — real de ponta a ponta: cria o pedido (RPC
 * create_product_order, preço travado ali), gera o Pix/redirecionamento
 * via /api/mercadopago/checkout e só considera "pago" quando
 * /api/mercadopago/status confirma (que é quem também concede o acesso
 * real na biblioteca, ver activateProductOrderAfterPayment). Não há mais
 * nenhum passo local (Order/Sale/Entitlement mock) — o servidor é a única
 * fonte de verdade.
 */
export function CheckoutFlow({ product }: { product: Product }) {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("review");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitPrice = product.promoPrice ?? product.price;

  async function handleCreateOrder() {
    setError(null);
    setCreating(true);
    try {
      const order = await createProductOrder(supabase, product.id);

      const res = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, method, kind: "product", productId: product.id }),
      });
      const result = (await res.json().catch(() => ({}))) as CheckoutApiResult & { error?: string };
      if (!res.ok) throw new Error(result.error ?? "Não foi possível iniciar o pagamento.");

      setOrderId(order.id);
      setPayment({
        id: result.paymentId,
        orderId: order.id,
        status: result.status,
        amount: order.unitPriceCents / 100,
        currency: "BRL",
        method,
        createdAt: new Date().toISOString(),
        checkoutRedirectUrl: result.redirectUrl,
        checkoutQrCode: result.qrCode,
        checkoutQrCodeBase64: result.qrCodeBase64,
        checkoutExpiresAt: result.expiresAt,
      });
      setStep("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  async function syncStatus(id: string, mpPaymentIdHint?: string): Promise<Payment> {
    const params = new URLSearchParams({ orderId: id });
    if (mpPaymentIdHint) params.set("mpPaymentId", mpPaymentIdHint);
    const res = await fetch(`/api/mercadopago/status?${params.toString()}`);
    if (!res.ok) throw new Error("Não foi possível consultar o status do pagamento.");
    const data: { status: Payment["status"] } = await res.json();
    if (!payment) throw new Error("Pagamento não encontrado.");
    return { ...payment, status: data.status };
  }

  function handlePaid() {
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-8 text-center">
        <CheckCircle2 size={32} className="text-(--color-accent-text)" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-(--color-text)">Pagamento confirmado</h2>
        <p className="text-sm text-(--color-text-muted)">
          Seu conteúdo já está disponível na sua biblioteca.
        </p>
        <Link
          href="/biblioteca"
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover)"
        >
          Ir para a biblioteca
        </Link>
      </div>
    );
  }

  if (step === "pending" && orderId && payment) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
        <h2 className="text-base font-semibold text-(--color-text)">Aguardando pagamento</h2>
        <p className="text-sm text-(--color-text-muted)">
          Pagamento com status <span className="font-medium text-(--color-warning)">pendente</span>.
        </p>
        <MercadoPagoPixPanel payment={payment} paymentService={{ syncStatus }} onPaid={handlePaid} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-lg border border-(--color-border) p-4">
        <h2 className="text-sm font-medium text-(--color-text)">Resumo do pedido</h2>
        <div className="flex items-center justify-between text-sm text-(--color-text-muted)">
          <span>{product.title}</span>
          <PriceTag price={product.price} promoPrice={product.promoPrice} size="sm" />
        </div>
        <div className="flex items-center justify-between border-t border-(--color-border) pt-2 text-sm font-medium text-(--color-text)">
          <span>Total</span>
          <span>{unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-(--color-text)">Forma de pagamento</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMethod("pix")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm ${
              method === "pix"
                ? "border-(--color-accent-text) text-(--color-accent-text)"
                : "border-(--color-border) text-(--color-text-muted)"
            }`}
          >
            <QrCode size={14} strokeWidth={1.5} /> Pix
          </button>
          <button
            type="button"
            onClick={() => setMethod("credit_card")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm ${
              method === "credit_card"
                ? "border-(--color-accent-text) text-(--color-accent-text)"
                : "border-(--color-border) text-(--color-text-muted)"
            }`}
          >
            <CreditCard size={14} strokeWidth={1.5} /> Cartão de crédito
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

      <button
        type="button"
        onClick={handleCreateOrder}
        disabled={creating}
        className="rounded-md bg-(--color-accent) px-4 py-2.5 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
      >
        {creating ? "Iniciando pagamento..." : "Finalizar compra"}
      </button>
    </div>
  );
}
