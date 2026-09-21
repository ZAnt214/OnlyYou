"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { categories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/client";
import { createServiceRequest } from "@/lib/supabase/serviceRequests";
import { useCurrentUserId } from "@/lib/supabase/useCurrentUser";

export function ServiceRequestPublisher() {
  const router = useRouter();
  const { userId, loading } = useCurrentUserId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("design");
  const [budget, setBudget] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-(--color-surface-2)" />;
  }

  if (!userId) {
    return (
      <div className="border-t border-(--color-border) py-8 text-center">
        <p className="text-sm text-(--color-text-muted)">Entre na sua conta para publicar o serviço que procura.</p>
        <Link
          href="/entrar"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-(--color-accent) px-5 text-sm font-semibold text-(--color-on-accent)"
        >
          Entrar para publicar
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createServiceRequest(createClient(), {
        title,
        description,
        category,
        budgetCents: budget ? Math.round(Number(budget.replace(",", ".")) * 100) : undefined,
        desiredDeliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
      });
      router.push("/oportunidades/minhas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível publicar agora.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "min-h-11 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text) outline-none focus:border-(--color-accent-text)";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="request-title" className="text-sm font-semibold text-(--color-text)">O que você precisa?</label>
        <input
          id="request-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={8}
          maxLength={100}
          required
          placeholder="Ex.: Preciso de alguém para criar a arte do meu canal"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="request-description" className="text-sm font-semibold text-(--color-text)">Explique o projeto</label>
        <textarea
          id="request-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          minLength={20}
          maxLength={2000}
          rows={6}
          required
          placeholder="Conte o estilo, o que precisa receber, referências e qualquer detalhe importante para o profissional entender o trabalho."
          className={inputClass}
        />
        <span className="text-right text-xs text-(--color-text-subtle)">{description.length}/2000</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="request-category" className="text-sm font-semibold text-(--color-text)">Categoria</label>
          <select id="request-category" value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="request-budget" className="text-sm font-semibold text-(--color-text)">Orçamento máximo (opcional)</label>
          <input id="request-budget" type="number" min="5" step="0.01" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="R$ 150,00" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor="request-deadline" className="text-sm font-semibold text-(--color-text)">Prazo desejado (opcional)</label>
        <div className="flex items-center gap-2">
          <input id="request-deadline" type="number" min="1" max="365" value={deliveryDays} onChange={(event) => setDeliveryDays(event.target.value)} placeholder="7" className={`${inputClass} min-w-0 flex-1`} />
          <span className="text-sm text-(--color-text-muted)">dias</span>
        </div>
      </div>

      <div className="border-t border-(--color-border) pt-4">
        <p className="text-xs leading-relaxed text-(--color-text-subtle)">
          A publicação fica disponível por 30 dias. Quando um profissional responder, a conversa aparece em Mensagens. Combine e pague sempre dentro do Jobê.
        </p>
        {error ? <p className="mt-3 text-sm text-(--color-danger)">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-(--color-accent) px-5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60 sm:w-auto"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
          Publicar oportunidade
        </button>
      </div>
    </form>
  );
}
