"use client";

import { useState } from "react";
import Link from "next/link";
import { AgeGate } from "@/components/AgeGate";

export default function CadastroPage() {
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold text-(--color-text)">Criar conta</h1>

      {!ageConfirmed ? (
        <AgeGate onConfirm={() => setAgeConfirmed(true)} />
      ) : (
        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-(--color-text)">
            Nome de usuário
            <input
              type="text"
              required
              className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-(--color-text)">
            E-mail
            <input
              type="email"
              required
              className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-(--color-text)">
            Senha
            <input
              type="password"
              required
              className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
          >
            Criar conta
          </button>
        </form>
      )}

      <p className="text-sm text-(--color-text-muted)">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-(--color-accent) hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
