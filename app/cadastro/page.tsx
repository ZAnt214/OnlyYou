"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  normalizeEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validatePassword,
} from "@/lib/auth-security";

const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;

export default function CadastroPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = normalizeEmail(email);
    const safeDisplayName = displayName.trim() || normalizedUsername;

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setError("Nome de usuário: só letras minúsculas, números, ponto e underline (3–30 caracteres).");
      return;
    }

    const passwordError = validatePassword(password, [
      normalizedUsername,
      normalizedEmail.split("@")[0] ?? "",
    ]);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== passwordConfirmation) {
      setError("As senhas não são iguais.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { username: normalizedUsername, display_name: safeDisplayName } },
      });

      if (signUpError || !data.session) {
        setError("Não foi possível criar a conta com esses dados. Revise e tente novamente.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Não foi possível criar a conta agora. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
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
            minLength={3}
            maxLength={30}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-(--color-text)">
          Nome de exibição
          <input
            type="text"
            maxLength={80}
            autoComplete="name"
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
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
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
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
        </label>
        <p className="text-xs leading-5 text-(--color-text-muted)">
          Use {PASSWORD_MIN_LENGTH} ou mais caracteres, misturando letras com números ou símbolos.
        </p>
        <label className="flex flex-col gap-1 text-sm text-(--color-text)">
          Confirmar senha
          <input
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
          />
        </label>
        {error ? <p role="alert" className="text-sm text-(--color-danger)">{error}</p> : null}
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
