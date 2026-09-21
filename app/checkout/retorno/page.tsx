"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type Outcome = "checking" | "paid" | "pending" | "failed" | "not-found";

interface StatusApiResult {
  status: "pending" | "processing" | "paid" | "failed" | "chargeback" | "refunded";
  paid: boolean;
}

/**
 * Retorno do Checkout Pro (cartão/boleto) após o pagamento no ambiente do
 * Mercado Pago. Nunca confia no status vindo da própria URL — sempre
 * reconsulta /api/mercadopago/status, que por sua vez confirma junto à API
 * do Mercado Pago (nunca no navegador) e é quem concede o acesso real na
 * biblioteca (ver activateProductOrderAfterPayment). Esta página só
 * reflete o resultado, nunca decide nada sozinha.
 */
export default function CheckoutReturnPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
      <Suspense>
        <CheckoutReturnContent />
      </Suspense>
    </div>
  );
}

function CheckoutReturnContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const mpPaymentId = searchParams.get("payment_id");

  const [outcome, setOutcome] = useState<Outcome>(orderId ? "checking" : "not-found");

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const params = new URLSearchParams({ orderId });
    if (mpPaymentId) params.set("mpPaymentId", mpPaymentId);

    fetch(`/api/mercadopago/status?${params.toString()}`)
      .then((res) => res.json())
      .then((data: StatusApiResult) => {
        if (cancelled) return;
        if (data.paid) setOutcome("paid");
        else if (data.status === "failed" || data.status === "chargeback") setOutcome("failed");
        else setOutcome("pending");
      })
      .catch(() => {
        if (!cancelled) setOutcome("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, mpPaymentId]);

  if (outcome === "checking") {
    return (
      <Status
        icon={<Loader2 size={32} className="animate-spin text-(--color-text-muted)" strokeWidth={1.5} />}
        title="Confirmando pagamento"
        description="Estamos verificando o status junto ao Mercado Pago."
      />
    );
  }

  if (outcome === "paid") {
    return (
      <Status
        icon={<CheckCircle2 size={32} className="text-(--color-accent-text)" strokeWidth={1.5} />}
        title="Pagamento confirmado"
        description="Seu conteúdo já está disponível na sua biblioteca."
        action={{ href: "/biblioteca", label: "Ir para a biblioteca" }}
      />
    );
  }

  if (outcome === "pending") {
    return (
      <Status
        icon={<Loader2 size={32} className="text-(--color-warning)" strokeWidth={1.5} />}
        title="Pagamento ainda pendente"
        description="Assim que o Mercado Pago confirmar, seu conteúdo será liberado."
        action={{ href: "/biblioteca", label: "Ver biblioteca" }}
      />
    );
  }

  if (outcome === "failed") {
    return (
      <Status
        icon={<XCircle size={32} className="text-(--color-danger)" strokeWidth={1.5} />}
        title="Pagamento não aprovado"
        description="O Mercado Pago não conseguiu aprovar este pagamento. Tente novamente."
        action={{ href: "/biblioteca", label: "Voltar" }}
      />
    );
  }

  return (
    <Status
      icon={<XCircle size={32} className="text-(--color-danger)" strokeWidth={1.5} />}
      title="Pedido não encontrado"
      description="Não encontramos este pedido."
      action={{ href: "/", label: "Voltar ao início" }}
    />
  );
}

function Status({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-8 text-center">
      {icon}
      <h1 className="text-lg font-semibold text-(--color-text)">{title}</h1>
      <p className="text-sm text-(--color-text-muted)">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover)"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
