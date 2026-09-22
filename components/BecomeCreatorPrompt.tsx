"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/lib/types";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { createClient } from "@/lib/supabase/client";

interface BecomeCreatorPromptProps {
  user: User;
}

/**
 * Mostrado no lugar de CreatorProfileView quando uma pessoa real, logada,
 * visita o próprio perfil mas ainda não é criadora (`roles` não inclui
 * "creator"). Chama a função Postgres `become_creator()` via RPC — ela roda
 * como SECURITY DEFINER e só adiciona "creator" ao `roles` do próprio
 * chamador (auth.uid()), nunca de outra linha.
 */
export function BecomeCreatorPrompt({ user }: BecomeCreatorPromptProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBecomeCreator() {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("become_creator");
      if (rpcError) {
        setError(rpcError.message);
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Não foi possível concluir agora. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <MediaPlaceholder seed={user.id} kind="avatar" className="h-20 w-20" label={user.displayName} />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-(--color-text)">{user.displayName}</h1>
          <span className="text-sm text-(--color-text-subtle)">@{user.username}</span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
        <p className="text-sm font-medium text-(--color-text-muted)">Área profissional</p>
        <h2 className="text-base font-semibold text-(--color-text)">
          Seu talento está parado. Vamos mudar isso?
        </h2>
        <p className="max-w-md text-sm text-(--color-text-muted)">
          Transforme este espaço em seu perfil profissional. Você poderá publicar serviços e
          produtos digitais, responder oportunidades e receber pedidos personalizados.
        </p>
        <ul className="grid gap-2 text-sm text-(--color-text-muted) sm:grid-cols-2">
          <li className="border-l-2 border-(--color-border) pl-3">Monte sua apresentação e portfólio</li>
          <li className="border-l-2 border-(--color-border) pl-3">Defina preços, prazos e entregas</li>
          <li className="border-l-2 border-(--color-border) pl-3">Encontre pedidos no feed de oportunidades</li>
          <li className="border-l-2 border-(--color-border) pl-3">Converse antes de fechar o trabalho</li>
        </ul>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-(--color-text-muted)">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-(--color-accent)"
          />
          <span>
            Li e aceito os <Link href="/termos" className="underline hover:text-(--color-text)">Termos do Jobê</Link> e as regras da <Link href="/seguranca" className="underline hover:text-(--color-text)">Central de segurança</Link>.
          </span>
        </label>
        <button
          type="button"
          onClick={handleBecomeCreator}
          disabled={submitting || !accepted}
          className="min-h-11 rounded-full bg-(--color-accent) px-5 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Processando..." : "Quero oferecer meus serviços"}
        </button>
        {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
      </div>
    </div>
  );
}
