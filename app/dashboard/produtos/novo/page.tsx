"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import type { ProductType } from "@/lib/types";
import { categories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/client";
import { createProduct } from "@/lib/supabase/products";
import { uploadFile } from "@/lib/uploadFile";

const STEPS = ["Informações", "Conteúdo", "Venda", "Revisão"];

interface FormState {
  title: string;
  description: string;
  category: string;
  type: ProductType;
  price: string;
  promoPrice: string;
  coverImageUrl: string;
  previewImagesText: string;
  fileUrl: string;
  fileName: string;
}

const initialState: FormState = {
  title: "",
  description: "",
  category: "packs-digitais",
  type: "digital_pack",
  price: "",
  promoPrice: "",
  coverImageUrl: "",
  previewImagesText: "",
  fileUrl: "",
  fileName: "",
};

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toCents(value: string): number | null {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Math.round(parseFloat(normalized) * 100);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

export default function NovoProdutoPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    setError(null);
    try {
      update("coverImageUrl", await uploadFile(file, "product-image"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handlePreviewUpload(files: FileList) {
    setUploadingPreview(true);
    setError(null);
    try {
      const urls = await Promise.all(Array.from(files).map((file) => uploadFile(file, "product-image")));
      setForm((f) => ({ ...f, previewImagesText: [f.previewImagesText, ...urls].filter(Boolean).join("\n") }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    } finally {
      setUploadingPreview(false);
    }
  }

  async function handleFileUpload(file: File) {
    setUploadingFile(true);
    setError(null);
    try {
      const url = await uploadFile(file, "product-file");
      setForm((f) => ({ ...f, fileUrl: url, fileName: file.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      setUploadingFile(false);
    }
  }

  async function handlePublish() {
    setError(null);
    setPublishing(true);
    try {
      const priceCents = toCents(form.price);
      if (priceCents === null) throw new Error("Informe um preço válido.");
      await createProduct(createClient(), {
        title: form.title,
        description: form.description,
        category: form.category,
        tags: [],
        type: form.type,
        priceCents,
        promoPriceCents: toCents(form.promoPrice),
        coverImageUrl: form.coverImageUrl,
        previewImages: toLines(form.previewImagesText),
        fileUrl: form.fileUrl,
        status: "approved",
      });
      setPublished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível publicar o produto.");
    } finally {
      setPublishing(false);
    }
  }

  if (published) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-8 text-center">
        <CheckCircle2 size={32} className="text-(--color-accent)" strokeWidth={1.5} />
        <h1 className="text-lg font-semibold text-(--color-text)">Produto publicado</h1>
        <p className="text-sm text-(--color-text-muted)">
          &quot;{form.title || "Seu produto"}&quot; já está disponível no catálogo.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/produtos")}
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover)"
        >
          Ver meus produtos
        </button>
      </div>
    );
  }

  const canAdvanceFromStep1 = form.title.trim() !== "" && form.category.trim() !== "";
  const canAdvanceFromStep2 = form.fileUrl.trim() !== "";
  const canPublish = canAdvanceFromStep1 && canAdvanceFromStep2 && toCents(form.price) !== null;

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
                placeholder="Ex.: Pack de templates para redes sociais"
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
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
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
                <option value="digital_pack">Pack digital</option>
                <option value="art">Arte</option>
                <option value="design">Design</option>
                <option value="music">Música</option>
                <option value="gaming">Gaming</option>
                <option value="tutorial">Tutorial</option>
                <option value="education">Educação</option>
                <option value="ebook">E-book</option>
                <option value="template">Template</option>
                <option value="exclusive">Conteúdo exclusivo</option>
                <option value="custom_service">Serviço personalizado</option>
                <option value="consulting">Consultoria</option>
                <option value="marketing">Marketing</option>
                <option value="social_media">Social Media</option>
                <option value="programming">Programação</option>
                <option value="web_development">Desenvolvimento web</option>
                <option value="ui_ux">UI/UX</option>
                <option value="copywriting">Redação e copywriting</option>
                <option value="translation">Tradução</option>
                <option value="other">Outro</option>
              </select>
            </Field>

            <Field label="Arquivo entregue ao comprador">
              <span className="text-xs font-normal text-(--color-text-subtle)">
                O que a pessoa recebe na biblioteca depois de pagar — zip, PDF, vídeo, imagem etc.
              </span>
              <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-2)">
                {uploadingFile ? (
                  <Loader2 size={14} className="animate-spin" strokeWidth={1.5} />
                ) : (
                  <Upload size={14} strokeWidth={1.5} />
                )}
                {form.fileName || "Enviar arquivo"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </Field>

            <Field label="Imagem de capa (opcional)">
              <div className="flex items-center gap-2">
                <input
                  value={form.coverImageUrl}
                  onChange={(e) => update("coverImageUrl", e.target.value)}
                  type="url"
                  placeholder="Cole um link https://…"
                  className="flex-1 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-2)">
                  {uploadingCover ? (
                    <Loader2 size={14} className="animate-spin" strokeWidth={1.5} />
                  ) : (
                    <Upload size={14} strokeWidth={1.5} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleCoverUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </Field>

            <Field label="Mais imagens (opcional)">
              <span className="text-xs font-normal text-(--color-text-subtle)">
                Prévia do conteúdo — uma por linha se for colar links.
              </span>
              <textarea
                value={form.previewImagesText}
                onChange={(e) => update("previewImagesText", e.target.value)}
                rows={2}
                placeholder={"https://…\nhttps://…"}
                className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
              />
              <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 text-xs font-medium text-(--color-text) hover:bg-(--color-surface-2)">
                {uploadingPreview ? (
                  <Loader2 size={12} className="animate-spin" strokeWidth={1.5} />
                ) : (
                  <Upload size={12} strokeWidth={1.5} />
                )}
                Ou envie arquivos do computador
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) void handlePreviewUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </Field>
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
              <strong className="text-(--color-text)">Arquivo:</strong> {form.fileName || "—"}
            </p>
            <p className="text-xs text-(--color-text-subtle)">
              Ao publicar, o produto já fica visível no catálogo — não há fila de revisão manual
              hoje.
            </p>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

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
            disabled={(step === 0 && !canAdvanceFromStep1) || (step === 1 && !canAdvanceFromStep2)}
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-40"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            disabled={!canPublish || publishing}
            onClick={handlePublish}
            className="flex items-center gap-1.5 rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-40"
          >
            {publishing ? <Loader2 size={14} className="animate-spin" strokeWidth={1.5} /> : null}
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
