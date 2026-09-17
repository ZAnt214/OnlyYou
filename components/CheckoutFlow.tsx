"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, QrCode } from "lucide-react";
import type { Product, Order, Payment, PaymentMethod } from "@/lib/types";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import { useCheckoutServices } from "@/lib/services/useCheckoutServices";
import { PriceTag } from "@/components/PriceTag";
import { MercadoPagoPixPanel } from "@/components/payments/MercadoPagoPixPanel";
import { finalizeProductCheckout } from "@/lib/checkout/finalizeCheckout";

type Step = "review" | "pending" | "done";

export function CheckoutFlow({ product }: { product: Product }) {
  const session = useMockSession();
  const { orderService, paymentService, walletService, entitlementService } = useCheckoutServices();

  const [step, setStep] = useState<Step>("review");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitPrice = product.promoPrice ?? product.price;

  async function handleCreateOrder() {
    setError(null);
    setCreating(true);
    try {
      const newOrder = orderService.createOrderForProduct(session.currentUserId, product);
      const newPayment = await paymentService.startProductCheckout(newOrder, method);
      setOrder(newOrder);
      setPayment(newPayment);
      setStep("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  function handlePaid(confirmedPayment: Payment) {
    if (!order) return;
    finalizeProductCheckout({
      order,
      payment: confirmedPayment,
      userId: session.currentUserId,
      productId: product.id,
      orderService,
      walletService,
      entitlementService,
    });
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-8 text-center">
        <CheckCircle2 size={32} className="text-(--color-success)" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-(--color-text)">Pagamento confirmado</h2>
        <p className="text-sm text-(--color-text-muted)">
          Seu conteúdo já está disponível na sua biblioteca.
        </p>
        <Link
          href="/biblioteca"
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          Ir para a biblioteca
        </Link>
      </div>
    );
  }

  if (step === "pending") {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
        <h2 className="text-base font-semibold text-(--color-text)">Aguardando pagamento</h2>
        <p className="text-sm text-(--color-text-muted)">
          Pedido {order?.id} criado. Pagamento com status{" "}
          <span className="font-medium text-(--color-warning)">pendente</span>.
        </p>
        {payment ? (
          <MercadoPagoPixPanel payment={payment} paymentService={paymentService} onPaid={handlePaid} />
        ) : null}
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
                ? "border-(--color-accent) text-(--color-accent)"
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
                ? "border-(--color-accent) text-(--color-accent)"
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
        className="rounded-md bg-(--color-accent) px-4 py-2.5 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
      >
        {creating ? "Iniciando pagamento..." : "Finalizar compra"}
      </button>
    </div>
  );
}
