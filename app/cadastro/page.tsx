"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;

export default function CadastroPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!USERNAME_PATTERN.test(username)) {
      setError("Nome de usuário: só letras minúsculas, números, ponto e underline (3–30 caracteres).");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: displayName || username } },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      // Confirmação de e-mail ativada no projeto — sessão só começa depois
      // que o link recebido por e-mail for confirmado.
      setConfirmEmailSent(true);
    }
  }

  if (confirmEmailSent) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-3 px-4 py-16">
        <h1 className="text-xl font-semibold text-(--color-text)">Confirme seu e-mail</h1>
        <p className="text-sm text-(--color-text-muted)">
          Enviamos um link de confirmação para {email}. Sua conta fica ativa depois que você
          confirmar.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold text-(--color-text)">Criar conta</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-(--color-text)">
          Nome de usuário
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-(--color-text)">
          Nome de exibição
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-(--color-text)">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-(--color-text)">
          Senha
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
        </label>
        {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
        >
          {submitting ? "Criando conta…" : "Criar conta"}
        </button>
      </form>

      <p className="text-sm text-(--color-text-muted)">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-(--color-accent-text) hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
