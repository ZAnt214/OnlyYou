"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MessageSquarePlus, X } from "lucide-react";
import type { Gig } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import { createCustomRequest } from "@/lib/supabase/customRequests";

/**
 * "Solicitar" de um gig — mesmo mecanismo de CustomOrderForm (cria um
 * pedido personalizado real e abre a conversa), só que pré-preenchido a
 * partir do anúncio, com `sourceGigId` pra rastrear a origem. Preço e
 * prazo do gig são indicativos: o valor final ainda passa pela proposta
 * do criador na conversa, igual a qualquer pedido personalizado.
 */
export function RequestGigButton({
  gig,
  className,
}: {
  gig: Gig;
  className?: string;
}) {
  const router = useRouter();
  const { userId, loading } = useCurrentUserId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseClassName =
    className ??
    "flex items-center justify-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)";

  if (loading) return null;

  if (!userId) {
    return (
      <Link href="/entrar" className={baseClassName}>
        <MessageSquarePlus size={14} strokeWidth={1.5} />
        Solicitar
      </Link>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const serviceDetails = [
        gig.game ? `Jogo: ${gig.game}` : null,
        gig.platform ? `Plataforma/servidor: ${gig.platform}` : null,
        gig.sessionMinutes ? `Duração: ${gig.sessionMinutes} minutos` : null,
        gig.currentRank && gig.targetRank ? `Elo: ${gig.currentRank} → ${gig.targetRank}` : null,
      ].filter(Boolean);
      const description = [
        `Quero contratar: ${gig.title}`,
        serviceDetails.length ? serviceDetails.join("\n") : null,
        note.trim() || null,
      ].filter(Boolean).join("\n\n");
      const request = await createCustomRequest(supabase, {
        creatorId: gig.creatorId,
        description,
        sourceGigId: gig.id,
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
    setNote("");
    setError(null);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={baseClassName}>
        <MessageSquarePlus size={14} strokeWidth={1.5} />
        Solicitar
      </button>

      {open ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        >
          <div className="w-full max-w-sm rounded-2xl bg-(--color-surface) p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-(--color-text)">
                {sent ? "Pedido enviado" : `Solicitar: ${gig.title}`}
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
                  Agora é só combinar os detalhes com o criador pela conversa. O valor final e o
                  prazo são definidos ali, antes do pagamento.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/pedidos/${sent}`)}
                  className="w-fit rounded-(--radius-pill) bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover)"
                >
                  Ver conversa
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="gig-note" className="text-sm font-medium text-(--color-text)">
                    Detalhes do que você precisa (opcional)
                  </label>
                  <textarea
                    id="gig-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Conte mais sobre o que você precisa — o criador confirma o valor e o prazo na conversa."
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
                  className="flex items-center justify-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2.5 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
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
