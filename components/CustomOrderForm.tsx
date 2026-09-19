"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquarePlus, X, Loader2 } from "lucide-react";
import type { User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { createCustomRequest } from "@/lib/supabase/customRequests";
import { isEligibleForCustomRequests } from "@/lib/services/CustomRequestService";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * O pedido personalizado é a principal ação de conversão do perfil (é
 * literalmente contratar o criador) — por isso o botão que abre isso é a
 * mesma pill cheia usada pelo CTA de "Seguir", em vez do botão outline
 * discreto que era antes. O formulário virou modal (fixed inset-0), pra
 * poder viver junto dos outros botões de ação no topo do perfil sem
 * precisar expandir inline ali.
 */
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
  // Pedido personalizado grava em uma tabela real (creator_id é uuid). Um
  // criador de demonstração (lib/data/users.ts, ids tipo "user-c04") não
  // existe em profiles, então nunca pode receber um pedido de verdade.
  if (!UUID_RE.test(creator.id)) return null;

  if (!userId) {
    return (
      <Link
        href="/entrar"
        className="flex w-fit items-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
      >
        <MessageSquarePlus size={16} strokeWidth={1.5} />
        Pedir conteúdo personalizado
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

  function handleClose() {
    setOpen(false);
    setSent(null);
    setDescription("");
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-fit items-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
      >
        <MessageSquarePlus size={16} strokeWidth={1.5} />
        Pedir conteúdo personalizado
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-(--color-surface) p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-(--color-text)">
                {sent ? "Pedido enviado" : `Pedir conteúdo a ${creator.displayName}`}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar"
                className="rounded-full p-1 text-(--color-text-subtle) hover:bg-(--color-surface-2)"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {sent ? (
              <div className="mt-3 flex flex-col gap-3 text-sm">
                <p className="text-(--color-text-muted)">
                  O criador pode responder pela conversa. Se aceitar uma proposta, o pagamento e a
                  entrega seguem as mesmas regras de segurança de qualquer compra na plataforma.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/pedidos/${sent}`)}
                  className="w-fit rounded-(--radius-pill) bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
                >
                  Ver conversa
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
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
                  Mantenha toda a conversa e o pagamento dentro do Jobê — é o que garante a proteção
                  da plataforma em caso de problema com a entrega.
                </p>
                {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2.5 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" strokeWidth={1.5} /> : null}
                  Enviar pedido
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
