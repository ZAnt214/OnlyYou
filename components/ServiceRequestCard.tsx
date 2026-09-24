"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Loader2, MessageSquarePlus, X } from "lucide-react";
import type { ServiceRequest } from "@/lib/types";
import { categories } from "@/lib/data/categories";
import { formatBRL } from "@/components/PriceTag";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";
import {
  closeServiceRequest,
  expressServiceRequestInterest,
} from "@/lib/supabase/serviceRequests";

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function ServiceRequestCard({ request, feed = false }: { request: ServiceRequest; feed?: boolean }) {
  const router = useRouter();
  const { userId, loading } = useCurrentUserId();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOwner = userId === request.requesterId;
  const categoryName = categories.find((category) => category.slug === request.category)?.name ?? request.category;

  async function handleInterest(event: React.FormEvent) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (cleanMessage.length < 10) {
      setError("Escreva pelo menos 10 caracteres.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await expressServiceRequestInterest(createClient(), {
        requestId: request.id,
        message: cleanMessage,
      });
      router.push(`/dashboard/pedidos-personalizados/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível responder agora.");
      setSubmitting(false);
    }
  }

  async function handleCloseRequest() {
    setClosing(true);
    setError(null);
    try {
      await closeServiceRequest(createClient(), request.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível encerrar a publicação.");
    } finally {
      setClosing(false);
    }
  }

  return (
    <article className={`flex h-full flex-col border-b border-(--color-border) py-5 sm:rounded-2xl sm:border sm:bg-(--color-surface) sm:p-5 ${feed ? "sm:shadow-sm" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-(--color-accent-text)">{categoryName}</span>
            <span className="text-(--color-text-subtle)">Publicado em {shortDate(request.createdAt)}</span>
            {request.status === "closed" ? (
              <span className="text-(--color-text-subtle)">Encerrada</span>
            ) : null}
          </div>
          <h2 className="mt-2 text-lg font-semibold leading-snug text-(--color-text)">{request.title}</h2>
        </div>
        {request.requester ? (
          <div className="flex shrink-0 items-center gap-2">
            <MediaPlaceholder
              seed={request.requesterId}
              kind="avatar"
              className="h-9 w-9"
              label={request.requester.displayName}
            />
            <span className="hidden max-w-28 truncate text-xs text-(--color-text-muted) lg:block">
              {request.requester.displayName}
            </span>
          </div>
        ) : null}
      </div>

      <p className={`mt-3 text-sm leading-relaxed text-(--color-text-muted) ${feed ? "line-clamp-6" : "line-clamp-4"}`}>
        {request.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-(--color-text-muted)">
        <span className="font-semibold text-(--color-text)">
          {request.budgetCents ? `Até ${formatBRL(request.budgetCents / 100)}` : "Orçamento a combinar"}
        </span>
        {request.desiredDeliveryDays ? (
          <span className="flex items-center gap-1">
            <Clock size={13} aria-hidden="true" />
            Prazo desejado: {request.desiredDeliveryDays} {request.desiredDeliveryDays === 1 ? "dia" : "dias"}
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <CalendarDays size={13} aria-hidden="true" />
          Válida até {shortDate(request.expiresAt)}
        </span>
      </div>

      <div className="mt-auto pt-5">
        {isOwner ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/oportunidades/minhas" className="text-sm font-semibold text-(--color-accent-text) underline underline-offset-4">
              Gerenciar publicação
            </Link>
            {request.status === "open" ? (
              <button
                type="button"
                onClick={handleCloseRequest}
                disabled={closing}
                className="text-sm text-(--color-text-muted) hover:text-(--color-text) disabled:opacity-60"
              >
                {closing ? "Encerrando..." : "Encerrar"}
              </button>
            ) : null}
          </div>
        ) : request.status === "open" && !loading ? (
          userId ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setOpen(true);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-(--color-accent) px-4 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
            >
              <MessageSquarePlus size={16} aria-hidden="true" />
              Tenho interesse
            </button>
          ) : (
            <Link
              href="/entrar"
              className="inline-flex min-h-10 items-center rounded-full bg-(--color-accent) px-4 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
            >
              Entrar para responder
            </Link>
          )
        ) : null}
        {error && !open ? <p className="mt-2 text-sm text-(--color-danger)">{error}</p> : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-(--color-text)/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-(--color-surface) p-5 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-(--color-text)">Apresente seu trabalho</h2>
                <p className="mt-1 text-sm text-(--color-text-muted)">
                  Sua mensagem abre uma conversa com quem publicou. Depois, envie valor e prazo pela proposta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                aria-label="Fechar"
                className="rounded-full p-1 text-(--color-text-muted) hover:bg-(--color-surface-2)"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInterest} className="mt-4 flex flex-col gap-3">
              <label htmlFor={`interest-${request.id}`} className="text-sm font-medium text-(--color-text)">
                Por que você é uma boa escolha?
              </label>
              <textarea
                id={`interest-${request.id}`}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                minLength={10}
                maxLength={500}
                rows={4}
                required
                placeholder="Conte rapidamente sua experiência e como pode ajudar. Não envie telefone ou contato externo."
                className="rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2 text-base text-(--color-text) outline-none focus:border-(--color-accent-text) sm:text-sm"
              />
              <p className="text-xs text-(--color-text-subtle)">{message.length}/500 caracteres</p>
              {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-(--color-accent) px-5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
                Abrir conversa
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </article>
  );
}
