"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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

      <div className="flex flex-col items-start gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
        <Sparkles size={20} className="text-(--color-accent-text)" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-(--color-text)">
          Seu talento está parado. Vamos mudar isso?
        </h2>
        <p className="max-w-md text-sm text-(--color-text-muted)">
          Todo dia, alguém procura exatamente o que você sabe fazer. Publique seus serviços e
          produtos digitais, defina seu próprio preço e comece a ser encontrado — este espaço
          vira seu perfil público assim que você se tornar criador.
        </p>
        <button
          type="button"
          onClick={handleBecomeCreator}
          disabled={submitting}
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Processando..." : "Quero oferecer meus serviços"}
        </button>
        {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
      </div>
    </div>
  );
}
