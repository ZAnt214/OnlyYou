"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, X } from "lucide-react";

/**
 * Editor genérico de lista de tags (habilidades, idiomas) — mesma forma
 * de dado (string[] simples, sem posição/metadados), mesma interação
 * (chips + input livre). Usado por SkillsSection e, dentro de
 * ResumeSection, para Idiomas. Chips no estilo "informativo" (borda
 * simples, `--color-text-muted`), não o padrão accent-soft de badge de
 * status — habilidade declarada não é um estado ativo/aprovado.
 */
export function TagListEditor({
  heading = "h2",
  title,
  description,
  tags: initialTags,
  isOwnProfile,
  emptyText,
  placeholder,
  onSave,
  maxTags = 30,
  maxTagLength = 80,
}: {
  heading?: "h2" | "h3";
  title: string;
  description?: string;
  tags: string[];
  isOwnProfile: boolean;
  emptyText: string;
  placeholder: string;
  onSave: (tags: string[]) => Promise<void>;
  maxTags?: number;
  maxTagLength?: number;
}) {
  const [tags, setTags] = useState(initialTags);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwnProfile && tags.length === 0) return null;

  function openEdit() {
    setDraft(tags);
    setInputValue("");
    setError(null);
    setEditing(true);
  }

  function addTag() {
    const value = inputValue.trim();
    if (!value || draft.includes(value)) {
      setInputValue("");
      return;
    }
    if (value.length > maxTagLength) {
      setError(`Use no máximo ${maxTagLength} caracteres por item.`);
      return;
    }
    if (draft.length >= maxTags) {
      setError(`Use no máximo ${maxTags} itens.`);
      return;
    }
    setError(null);
    setDraft((d) => [...d, value]);
    setInputValue("");
  }

  function removeTag(tag: string) {
    setDraft((d) => d.filter((t) => t !== tag));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await onSave(draft);
      setTags(draft);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  const Heading = heading;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Heading
          className={heading === "h2" ? "text-base font-semibold text-(--color-text)" : "text-sm font-semibold text-(--color-text)"}
        >
          {title}
        </Heading>
        {isOwnProfile && !editing ? (
          <button
            type="button"
            onClick={openEdit}
            className="flex items-center gap-1 text-xs text-(--color-text-muted) hover:text-(--color-text)"
          >
            <Pencil size={12} strokeWidth={1.5} />
            Editar
          </button>
        ) : null}
      </div>
      {description ? <p className="text-xs text-(--color-text-subtle)">{description}</p> : null}

      {editing ? (
        <div className="flex flex-col gap-2">
          {draft.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {draft.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text)"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remover ${tag}`}
                    className="text-(--color-text-subtle) hover:text-(--color-text)"
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder={placeholder}
              maxLength={maxTagLength}
              className="min-w-0 flex-1 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-base focus:border-(--color-accent-text) focus:outline-none sm:text-sm"
            />
            <button
              type="button"
              onClick={addTag}
              aria-label="Adicionar"
              className="flex shrink-0 items-center gap-1 rounded-md border border-(--color-border) px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-2)"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
          </div>
          {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2 text-sm font-medium text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" strokeWidth={1.5} /> : null}
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-(--radius-pill) border border-(--color-border) px-4 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-2)"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : tags.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text-muted)"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
