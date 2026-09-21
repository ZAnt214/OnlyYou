"use client";

import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";

/**
 * Modal in-app (nunca window.open/popup real — bloqueadores de popup
 * matariam isso silenciosamente) pedindo a avaliação mútua ao final de um
 * pedido personalizado: 1-5 estrelas + comentário, um por participante.
 */
export function CustomOrderReviewModal({
  counterpartName,
  busy,
  error,
  onDismiss,
  onSubmit,
}: {
  counterpartName: string;
  busy: boolean;
  error: string | null;
  onDismiss: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return;
    onSubmit(rating, comment.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-(--color-surface) p-5 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-(--color-text)">Como foi sua experiência?</h2>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar"
            className="rounded-full p-1 text-(--color-text-subtle) hover:bg-(--color-surface-2)"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          Avalie {counterpartName} neste pedido. Sua nota e comentário ajudam outras pessoas.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
                className="p-1"
              >
                <Star
                  size={32}
                  strokeWidth={1.5}
                  className={
                    value <= (hoverRating || rating)
                      ? "text-(--color-accent-text)"
                      : "text-(--color-border)"
                  }
                  fill={value <= (hoverRating || rating) ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi (opcional)"
            rows={3}
            className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-accent-text) focus:outline-none"
          />

          {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 rounded-full border border-(--color-border) px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-2)"
            >
              Agora não
            </button>
            <button
              type="submit"
              disabled={busy || rating < 1}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-(--color-accent) px-3 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" strokeWidth={1.5} /> : null}
              Enviar avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
