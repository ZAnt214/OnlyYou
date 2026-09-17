"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";
import type { User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { createCustomRequest } from "@/lib/supabase/customRequests";
import { isEligibleForCustomRequests } from "@/lib/services/CustomRequestService";

export function CustomOrderForm({ creator }: { creator: User }) {
  const router = useRouter();
  const { userId, loading } = useCurrentUserId();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A UI esconde o botão quando o criador não está elegível, mas
  // create_custom_request() faz a mesma checagem no banco — a UI nunca é a
  // única barreira.
  if (!isEligibleForCustomRequests(creator)) return null;
  if (loading) return null;

  if (!userId) {
    return (
      <Link
        href="/entrar"
        className="flex items-center gap-2 rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text) hover:bg-(--color-surface)"
      >
        <MessageSquarePlus size={14} strokeWidth={1.5} />
        Entre para pedir personalizado
      </Link>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const request = await createCustomRequest(supabase, {
        creatorId: creator.id,
        description,
      });
      setSent(request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o pedido.");
    } finally {
      setSubmitting(false);
    }
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
          O criador pode responder pela conversa. Se aceitar uma proposta, o pagamento e a entrega
          seguem as mesmas regras de segurança de qualquer compra na plataforma.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/pedidos/${sent}`)}
          className="mt-3 rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          Ver conversa
        </button>
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
          placeholder="Conte o que você gostaria de receber. O criador decide se aceita o pedido e propõe um valor e prazo."
          className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
        />
      </div>
      <p className="text-xs text-(--color-text-subtle)">
        Mantenha toda a conversa e o pagamento dentro do Jobê — é o que garante a proteção da
        plataforma em caso de problema com a entrega.
      </p>
      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
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
