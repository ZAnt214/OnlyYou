"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";

// TODO(integração): implementar verificação real de idade/identidade com
// provedor especializado, considerando legislação, privacidade e requisitos
// aplicáveis. O que existe abaixo é apenas uma confirmação visual de data de
// nascimento, sem qualquer validação documental — não deve ser considerada
// suficiente para fins legais.

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setBirthDate(formatted);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseBirthDate(birthDate);
    if (!parsed) {
      setError("Informe uma data de nascimento válida no formato DD/MM/AAAA.");
      return;
    }
    const age = calculateAge(parsed);
    if (age < 18) {
      setError("Você precisa ter 18 anos ou mais para acessar o OnlyYou.");
      return;
    }
    setError(null);
    onConfirm();
  }

  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
      <div className="mb-3 flex items-center gap-2 text-(--color-text)">
        <ShieldAlert size={16} strokeWidth={1.5} className="text-(--color-accent)" />
        <h2 className="text-sm font-medium">Confirmação de idade</h2>
      </div>
      <p className="mb-4 text-sm text-(--color-text-muted)">
        Este é um marketplace de conteúdo adulto. Confirme sua data de nascimento para continuar.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-(--color-text)">
          Data de nascimento
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            maxLength={10}
            value={birthDate}
            onChange={handleDateChange}
            className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
          />
        </label>
        {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
        <button
          type="submit"
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          Confirmar que sou maior de 18 anos
        </button>
      </form>
    </div>
  );
}

/** Converte "DD/MM/AAAA" digitado em Date, ou null se inválido/incompleto. */
function parseBirthDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isValid ? date : null;
}

function calculateAge(birth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
