"use client";

import { useState } from "react";
import { Briefcase, ExternalLink, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createPortfolioItem, deletePortfolioItem, updatePortfolioItem } from "@/lib/supabase/portfolio";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { uploadFile } from "@/lib/uploadFile";
import type { PortfolioItem } from "@/lib/types";

interface FormState {
  title: string;
  description: string;
  externalUrl: string;
  imageUrl: string;
  content: string;
  galleryText: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  externalUrl: "",
  imageUrl: "",
  content: "",
  galleryText: "",
};

function toGalleryUrls(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Portfólio de trabalhos já realizados — diferente de Produtos (que são
 * anúncios à venda). Cada card é um resumo (capa, título, descrição
 * curta); clicar nele expande e mostra o trabalho completo (texto longo +
 * galeria de imagens) num modal de detalhe. Só o dono do perfil vê os
 * controles de adicionar/editar/excluir; a listagem em si é pública (RLS
 * de portfolio_items permite leitura a qualquer um).
 */
export function PortfolioSection({
  initialItems,
  isOwnProfile,
  title = "Portfólio",
}: {
  initialItems: PortfolioItem[];
  isOwnProfile: boolean;
  title?: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<PortfolioItem | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadFile(file, "portfolio-image");
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGalleryUpload(files: FileList) {
    setUploadingGallery(true);
    setError(null);
    try {
      const urls = await Promise.all(Array.from(files).map((file) => uploadFile(file, "portfolio-image")));
      setForm((f) => ({
        ...f,
        galleryText: [f.galleryText, ...urls].filter(Boolean).join("\n"),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    } finally {
      setUploadingGallery(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(item: PortfolioItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      externalUrl: item.externalUrl ?? "",
      imageUrl: item.imageUrl ?? "",
      content: item.content,
      galleryText: item.galleryUrls.join("\n"),
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const input = {
      title: form.title,
      description: form.description,
      externalUrl: form.externalUrl,
      imageUrl: form.imageUrl,
      content: form.content,
      galleryUrls: toGalleryUrls(form.galleryText),
    };
    try {
      if (editingId) {
        const updated = await updatePortfolioItem(supabase, editingId, input);
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        setViewingItem((v) => (v?.id === editingId ? updated : v));
      } else {
        const created = await createPortfolioItem(supabase, input);
        setItems((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o trabalho.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await deletePortfolioItem(supabase, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setViewingItem((v) => (v?.id === id ? null : v));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o trabalho.");
    } finally {
      setBusy(false);
    }
  }

  if (!isOwnProfile && items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-(--color-text)">{title}</h2>
        {isOwnProfile ? (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-(--radius-pill) border border-(--color-border) px-3 py-1.5 text-sm font-medium text-(--color-text) hover:bg-(--color-surface-2)"
          >
            <Plus size={14} strokeWidth={1.5} />
            Adicionar trabalho
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">Nenhum trabalho adicionado ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 shadow-sm"
            >
              <button
                type="button"
                onClick={() => setViewingItem(item)}
                className="flex flex-col gap-2 text-left"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ) : (
                  <MediaPlaceholder seed={item.id} className="aspect-square w-full" label={item.title} />
                )}
                <span className="line-clamp-1 text-sm font-medium text-(--color-text)">{item.title}</span>
                {item.description ? (
                  <p className="line-clamp-2 text-xs text-(--color-text-muted)">{item.description}</p>
                ) : null}
              </button>
              {isOwnProfile ? (
                <div className="flex items-center gap-2 border-t border-(--color-border) pt-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="flex items-center gap-1 text-xs text-(--color-text-muted) hover:text-(--color-text)"
                  >
                    <Pencil size={12} strokeWidth={1.5} />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1 text-xs text-(--color-danger) hover:underline disabled:opacity-60"
                  >
                    <Trash2 size={12} strokeWidth={1.5} />
                    Excluir
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {viewingItem ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-(--color-surface) shadow-lg shadow-black/10">
            <div className="flex items-center justify-between gap-3 border-b border-(--color-border) p-4">
              <h2 className="text-base font-semibold text-(--color-text)">{viewingItem.title}</h2>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                aria-label="Fechar"
                className="rounded-full p-1 text-(--color-text-subtle) hover:bg-(--color-surface-2)"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto p-4">
              {viewingItem.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewingItem.imageUrl}
                  alt={viewingItem.title}
                  className="w-full rounded-xl object-cover"
                />
              ) : (
                <MediaPlaceholder seed={viewingItem.id} className="aspect-video w-full" label={viewingItem.title} />
              )}

              {viewingItem.galleryUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {viewingItem.galleryUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`${viewingItem.title} — imagem ${i + 2}`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              ) : null}

              {viewingItem.description ? (
                <p className="text-sm font-medium text-(--color-text)">{viewingItem.description}</p>
              ) : null}

              {viewingItem.content ? (
                <p className="whitespace-pre-wrap text-sm text-(--color-text-muted)">{viewingItem.content}</p>
              ) : null}

              {viewingItem.externalUrl ? (
                <a
                  href={viewingItem.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover)"
                >
                  <ExternalLink size={14} strokeWidth={1.5} />
                  Ver trabalho
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl bg-(--color-surface) shadow-lg shadow-black/10">
            <div className="flex items-center justify-between gap-3 p-5 pb-0">
              <h2 className="flex items-center gap-1.5 text-base font-semibold text-(--color-text)">
                <Briefcase size={16} strokeWidth={1.5} />
                {editingId ? "Editar trabalho" : "Novo trabalho"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Fechar"
                className="rounded-full p-1 text-(--color-text-subtle) hover:bg-(--color-surface-2)"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto p-5">
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Título
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="Ex.: Ensaio fotográfico para marca X"
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
                />
              </label>

              <FormSectionLabel>O que aparece na lista do portfólio</FormSectionLabel>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Resumo curto
                <span className="text-xs font-normal text-(--color-text-subtle)">
                  Fica visível direto no card, embaixo da capa — sem precisar clicar.
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Uma linha curta sobre o trabalho (opcional)"
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
                />
              </label>

              <FormSectionLabel>O que aparece só ao abrir o trabalho</FormSectionLabel>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Trabalho completo
                <span className="text-xs font-normal text-(--color-text-subtle)">
                  Texto mais longo — contexto, processo, resultado. Só aparece quando alguém
                  clica no card pra ver os detalhes.
                </span>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={5}
                  placeholder="Descreva o trabalho completo: contexto, processo, resultado (opcional)"
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
                />
              </label>

              <FormSectionLabel>Imagens</FormSectionLabel>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Imagem de capa
                <span className="text-xs font-normal text-(--color-text-subtle)">
                  A foto principal — é a que aparece no card da lista.
                </span>
                <div className="flex items-center gap-2">
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    type="url"
                    placeholder="Cole um link https://… (opcional)"
                    className="flex-1 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
                  />
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-2)">
                    {uploadingCover ? (
                      <Loader2 size={14} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Upload size={14} strokeWidth={1.5} />
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleCoverUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <span className="text-xs font-normal text-(--color-text-subtle)">
                  Ou clique no ícone de upload pra enviar um arquivo do computador — o link
                  acima é preenchido automaticamente.
                </span>
              </label>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Mais imagens
                <span className="text-xs font-normal text-(--color-text-subtle)">
                  Fotos extras da galeria — aparecem só na tela de detalhes, não no card. Uma
                  por linha se for colar links.
                </span>
                <textarea
                  value={form.galleryText}
                  onChange={(e) => setForm((f) => ({ ...f, galleryText: e.target.value }))}
                  rows={3}
                  placeholder={"https://…\nhttps://…"}
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
                />
                <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 text-xs font-medium text-(--color-text) hover:bg-(--color-surface-2)">
                  {uploadingGallery ? (
                    <Loader2 size={12} className="animate-spin" strokeWidth={1.5} />
                  ) : (
                    <Upload size={12} strokeWidth={1.5} />
                  )}
                  Ou envie arquivos do computador
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) void handleGalleryUpload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </label>

              <FormSectionLabel>Link externo</FormSectionLabel>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Link para ver o trabalho
                <span className="text-xs font-normal text-(--color-text-subtle)">
                  Se o trabalho está publicado em outro lugar (Behance, Instagram, site
                  próprio), cole o link aqui — vira um botão &quot;Ver trabalho&quot; na tela de
                  detalhes.
                </span>
                <input
                  value={form.externalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                  type="url"
                  placeholder="https://… (opcional)"
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent-text) focus:outline-none"
                />
              </label>

              {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

              <button
                type="submit"
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2.5 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" strokeWidth={1.5} /> : null}
                {editingId ? "Salvar alterações" : "Adicionar ao portfólio"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Divide o formulário em blocos (o que aparece na lista vs. só no detalhe, imagens, link) — pra não virar uma lista única de campos sem hierarquia. */
function FormSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="-mb-1 border-t border-(--color-border) pt-3 text-xs font-semibold uppercase tracking-wide text-(--color-text-subtle)">
      {children}
    </p>
  );
}
