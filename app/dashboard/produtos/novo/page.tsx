"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { ProductType } from "@/lib/types";
import { moderationService } from "@/lib/moderation/ModerationService";

const STEPS = ["Informações", "Conteúdo", "Venda", "Revisão"];

interface FormState {
  title: string;
  description: string;
  category: string;
  type: ProductType;
  price: string;
  promoPrice: string;
  fileCount: number;
}

const initialState: FormState = {
  title: "",
  description: "",
  category: "packs",
  type: "pack",
  price: "",
  promoPrice: "",
  fileCount: 0,
};

export default function NovoProdutoPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [published, setPublished] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePublish() {
    moderationService.submitForReview();
    setPublished(true);
  }

  if (published) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-8 text-center">
        <CheckCircle2 size={32} className="text-(--color-success)" strokeWidth={1.5} />
        <h1 className="text-lg font-semibold text-(--color-text)">Produto enviado para análise</h1>
        <p className="text-sm text-(--color-text-muted)">
          &quot;{form.title || "Seu produto"}&quot; está com status &quot;Em análise&quot; e será
          publicado após a revisão da equipe de moderação.
        </p>
        <Link
          href="/dashboard/produtos"
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
        >
          Ver meus produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-(--color-text)">Adicionar produto</h1>

      <ol className="flex gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-md border px-2 py-1.5 text-center text-xs ${
              i === step
                ? "border-(--color-accent) text-(--color-accent)"
                : i < step
                  ? "border-(--color-border) text-(--color-text-muted)"
                  : "border-(--color-border) text-(--color-text-subtle)"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-4 rounded-lg border border-(--color-border) p-4">
        {step === 0 ? (
          <div className="flex flex-col gap-3">
            <Field label="Título">
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Ex.: Pack Privado #08"
                className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
              />
            </Field>
            <Field label="Descrição">
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="Descreva o conteúdo, quantidade de itens e diferenciais."
                className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
              />
            </Field>
            <Field label="Categoria">
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
              >
                <option value="fotos">Fotos</option>
                <option value="videos">Vídeos</option>
                <option value="packs">Packs</option>
                <option value="ensaios">Ensaios</option>
                <option value="conteudo-personalizado">Conteúdo personalizado</option>
                <option value="bundles">Bundles</option>
              </select>
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-3">
            <Field label="Tipo de conteúdo">
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value as ProductType)}
                className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
              >
                <option value="photo">Foto</option>
                <option value="video">Vídeo</option>
                <option value="pack">Pack</option>
                <option value="bundle">Bundle</option>
                <option value="custom">Personalizado</option>
                <option value="other">Outro</option>
              </select>
            </Field>
            <div className="flex flex-col gap-1 text-sm text-(--color-text)">
              Arquivos
              <button
                type="button"
                onClick={() => update("fileCount", form.fileCount + 1)}
                className="w-fit rounded-md border border-dashed border-(--color-border) px-4 py-6 text-sm text-(--color-text-muted) hover:border-(--color-accent)"
              >
                Simular envio de arquivo ({form.fileCount} adicionado{form.fileCount === 1 ? "" : "s"})
              </button>
              <p className="text-xs text-(--color-text-subtle)">
                Armazenamento de mídia simulado nesta fase — nenhum arquivo real é enviado.
              </p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-3">
            <Field label="Preço (R$)">
              <input
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="39,90"
                className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
              />
            </Field>
            <Field label="Preço promocional (opcional)">
              <input
                value={form.promoPrice}
                onChange={(e) => update("promoPrice", e.target.value)}
                placeholder="29,90"
                className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
              />
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-2 text-sm text-(--color-text-muted)">
            <h2 className="text-sm font-medium text-(--color-text)">Revisão</h2>
            <p>
              <strong className="text-(--color-text)">Título:</strong> {form.title || "—"}
            </p>
            <p>
              <strong className="text-(--color-text)">Categoria:</strong> {form.category}
            </p>
            <p>
              <strong className="text-(--color-text)">Tipo:</strong> {form.type}
            </p>
            <p>
              <strong className="text-(--color-text)">Preço:</strong> R$ {form.price || "0,00"}
            </p>
            <p>
              <strong className="text-(--color-text)">Arquivos:</strong> {form.fileCount}
            </p>
            <p className="text-xs text-(--color-text-subtle)">
              Ao publicar, o produto entra em análise (status &quot;pending_review&quot;) antes de
              ficar visível no catálogo.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="rounded-md border border-(--color-border) px-4 py-2 text-sm text-(--color-text) disabled:opacity-40"
        >
          Voltar
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
          >
            Publicar produto
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-(--color-text)">
      {label}
      {children}
    </label>
  );
}
