"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import { customRequestRepository } from "@/lib/repositories/CustomRequestRepository";

export function CustomOrderForm({ creatorId }: { creatorId: string }) {
  const session = useMockSession();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    await customRequestRepository.create({
      id: `custom-${Date.now()}`,
      buyerId: session.currentUserId,
      creatorId,
      description: description.trim(),
      budget: budget ? Number(budget) : undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    setSubmitting(false);
    setSent(true);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text) hover:bg-(--color-surface)"
      >
        <MessageSquarePlus size={14} strokeWidth={1.5} />
        Pedir conteúdo personalizado
      </button>
    );
  }

  if (sent) {
    return (
      <div className="rounded-md border border-(--color-border) p-4 text-sm">
        <p className="text-(--color-text)">Pedido enviado.</p>
        <p className="mt-1 text-(--color-text-muted)">
          O criador pode aceitar ou recusar. Se aceitar, o pagamento e a entrega seguem as mesmas
          regras de segurança de qualquer compra na plataforma.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-md border border-(--color-border) p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="custom-description" className="text-sm font-medium text-(--color-text)">
          Descreva o que você quer
        </label>
        <textarea
          id="custom-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          placeholder="Conte o que você gostaria de receber. O criador decide se aceita o pedido."
          className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="custom-budget" className="text-sm font-medium text-(--color-text)">
          Orçamento sugerido (opcional)
        </label>
        <input
          id="custom-budget"
          type="number"
          min={0}
          step="0.01"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="R$"
          className="w-40 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
        >
          Enviar pedido
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-3 py-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text)"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
