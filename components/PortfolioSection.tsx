"use client";

import { useState } from "react";
import { Briefcase, ExternalLink, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createPortfolioItem, deletePortfolioItem, updatePortfolioItem } from "@/lib/supabase/portfolio";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { PortfolioItem } from "@/lib/types";

interface FormState {
  title: string;
  description: string;
  externalUrl: string;
  imageUrl: string;
}

const EMPTY_FORM: FormState = { title: "", description: "", externalUrl: "", imageUrl: "" };

/**
 * Portfólio de trabalhos já realizados — diferente de Produtos (que são
 * anúncios à venda). Só o dono do perfil vê os controles de
 * adicionar/editar/excluir; a listagem em si é pública (RLS de
 * portfolio_items permite leitura a qualquer um).
 */
export function PortfolioSection({
  initialItems,
  isOwnProfile,
}: {
  initialItems: PortfolioItem[];
  isOwnProfile: boolean;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await updatePortfolioItem(supabase, editingId, form);
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
      } else {
        const created = await createPortfolioItem(supabase, form);
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
        <h2 className="text-base font-semibold text-(--color-text)">Portfólio</h2>
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
              {item.externalUrl ? (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-1 text-xs font-medium text-(--color-accent) hover:underline"
                >
                  <ExternalLink size={12} strokeWidth={1.5} />
                  Ver trabalho
                </a>
              ) : null}
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

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-(--color-surface) p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between gap-3">
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

            <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Título
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="Ex.: Ensaio fotográfico para marca X"
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Descrição
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Conte um pouco sobre esse trabalho (opcional)"
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Link da imagem (opcional)
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  type="url"
                  placeholder="https://…"
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Link para ver o trabalho (opcional)
                <input
                  value={form.externalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                  type="url"
                  placeholder="https://…"
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </label>

              {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

              <button
                type="submit"
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2.5 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
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
