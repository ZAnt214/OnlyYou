"use client";

import { useState } from "react";
import { Award, GraduationCap, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  createResumeEntry,
  deleteResumeEntry,
  updateCreatorLanguages,
  updateResumeEntry,
} from "@/lib/supabase/resume";
import { TagListEditor } from "@/components/TagListEditor";
import type { ResumeEntry } from "@/lib/types";

interface FormState {
  title: string;
  institution: string;
  startMonth: string;
  endMonth: string;
  inProgress: boolean;
  url: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  institution: "",
  startMonth: "",
  endMonth: "",
  inProgress: false,
  url: "",
};

function isoToMonth(iso: string | null): string {
  return iso ? iso.slice(0, 7) : "";
}

function monthToISO(month: string): string {
  return month ? `${month}-01` : "";
}

function formatMonthYear(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

function formatPeriod(entry: ResumeEntry): string {
  if (entry.inProgress) {
    return entry.startDate ? `Cursando desde ${formatMonthYear(entry.startDate)}` : "Cursando";
  }
  if (entry.startDate && entry.endDate) {
    return `${formatMonthYear(entry.startDate)} – ${formatMonthYear(entry.endDate)}`;
  }
  if (entry.startDate) return `Desde ${formatMonthYear(entry.startDate)}`;
  if (entry.endDate) return formatMonthYear(entry.endDate);
  return "";
}

const KIND_LABELS: Record<ResumeEntry["kind"], { section: string; add: string; new: string; empty: string }> = {
  education: {
    section: "Formação",
    add: "Adicionar formação",
    new: "Nova formação",
    empty: "Nenhuma formação adicionada ainda.",
  },
  certification: {
    section: "Certificações",
    add: "Adicionar certificação",
    new: "Nova certificação",
    empty: "Nenhuma certificação adicionada ainda.",
  },
};

/**
 * Currículo do criador: formação + certificações (mesma tabela
 * resume_entries, discriminada por `kind` — os dois têm exatamente a
 * mesma forma: título, instituição, período, link opcional) e idiomas
 * (profiles.languages, via TagListEditor). Mesmo padrão de
 * PortfolioSection: lista pública, controles de adicionar/editar/excluir
 * só para o dono.
 */
export function ResumeSection({
  initialEntries,
  initialLanguages,
  isOwnProfile,
}: {
  initialEntries: ResumeEntry[];
  initialLanguages: string[];
  isOwnProfile: boolean;
}) {
  const supabase = createClient();
  const [entries, setEntries] = useState(initialEntries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKind, setFormKind] = useState<ResumeEntry["kind"] | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const education = entries.filter((e) => e.kind === "education");
  const certifications = entries.filter((e) => e.kind === "certification");

  if (!isOwnProfile && entries.length === 0 && initialLanguages.length === 0) return null;

  function openCreate(kind: ResumeEntry["kind"]) {
    setEditingId(null);
    setFormKind(kind);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function openEdit(entry: ResumeEntry) {
    setEditingId(entry.id);
    setFormKind(entry.kind);
    setForm({
      title: entry.title,
      institution: entry.institution,
      startMonth: isoToMonth(entry.startDate),
      endMonth: isoToMonth(entry.endDate),
      inProgress: entry.inProgress,
      url: entry.url ?? "",
    });
    setError(null);
  }

  function closeForm() {
    setFormKind(null);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formKind) return;
    setBusy(true);
    setError(null);
    const input = {
      kind: formKind,
      title: form.title,
      institution: form.institution,
      startDate: monthToISO(form.startMonth),
      endDate: monthToISO(form.endMonth),
      inProgress: form.inProgress,
      url: form.url,
    };
    try {
      if (editingId) {
        const updated = await updateResumeEntry(supabase, editingId, input);
        setEntries((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const created = await createResumeEntry(supabase, input);
        setEntries((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await deleteResumeEntry(supabase, id);
      setEntries((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir.");
    } finally {
      setBusy(false);
    }
  }

  function renderList(kind: ResumeEntry["kind"], list: ResumeEntry[]) {
    const labels = KIND_LABELS[kind];
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-(--color-text)">{labels.section}</h3>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => openCreate(kind)}
              className="flex items-center gap-1 text-xs font-medium text-(--color-accent) hover:underline"
            >
              <Plus size={12} strokeWidth={1.5} />
              {labels.add}
            </button>
          ) : null}
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">{labels.empty}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-(--color-text)">{entry.title}</span>
                  {entry.institution ? (
                    <span className="text-xs text-(--color-text-muted)">{entry.institution}</span>
                  ) : null}
                  {formatPeriod(entry) ? (
                    <span className="text-xs text-(--color-text-subtle)">{formatPeriod(entry)}</span>
                  ) : null}
                  {entry.url ? (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 w-fit text-xs font-medium text-(--color-accent) hover:underline"
                    >
                      Ver certificado
                    </a>
                  ) : null}
                </div>
                {isOwnProfile ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      aria-label="Editar"
                      className="text-(--color-text-subtle) hover:text-(--color-text)"
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      aria-label="Excluir"
                      className="text-(--color-text-subtle) hover:text-(--color-danger)"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-(--color-text)">Currículo</h2>

      {renderList("education", education)}
      {renderList("certification", certifications)}

      <TagListEditor
        heading="h3"
        title="Idiomas"
        tags={initialLanguages}
        isOwnProfile={isOwnProfile}
        emptyText="Nenhum idioma adicionado ainda."
        placeholder="Ex.: Inglês (avançado)"
        onSave={(languages) => updateCreatorLanguages(supabase, languages)}
      />

      {formKind ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl bg-(--color-surface) shadow-lg shadow-black/10">
            <div className="flex items-center justify-between gap-3 p-5 pb-0">
              <h2 className="flex items-center gap-1.5 text-base font-semibold text-(--color-text)">
                {formKind === "education" ? (
                  <GraduationCap size={16} strokeWidth={1.5} />
                ) : (
                  <Award size={16} strokeWidth={1.5} />
                )}
                {editingId ? "Editar item" : KIND_LABELS[formKind].new}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Fechar"
                className="rounded-full p-1 text-(--color-text-subtle) hover:bg-(--color-surface-2)"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-y-auto p-5">
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                {formKind === "education" ? "Curso" : "Nome da certificação"}
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  placeholder={formKind === "education" ? "Ex.: Design Gráfico" : "Ex.: Google Ads Certified"}
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                {formKind === "education" ? "Instituição" : "Emitido por"}
                <input
                  value={form.institution}
                  onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
                  placeholder={formKind === "education" ? "Ex.: Universidade Federal X" : "Ex.: Google"}
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </label>

              {formKind === "education" ? (
                <>
                  <div className="flex gap-2">
                    <label className="flex flex-1 flex-col gap-1 text-sm text-(--color-text)">
                      Início
                      <input
                        type="month"
                        value={form.startMonth}
                        onChange={(e) => setForm((f) => ({ ...f, startMonth: e.target.value }))}
                        className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                      />
                    </label>
                    {!form.inProgress ? (
                      <label className="flex flex-1 flex-col gap-1 text-sm text-(--color-text)">
                        Conclusão
                        <input
                          type="month"
                          value={form.endMonth}
                          onChange={(e) => setForm((f) => ({ ...f, endMonth: e.target.value }))}
                          className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                        />
                      </label>
                    ) : null}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-(--color-text)">
                    <input
                      type="checkbox"
                      checked={form.inProgress}
                      onChange={(e) => setForm((f) => ({ ...f, inProgress: e.target.checked }))}
                      className="h-4 w-4 rounded border-(--color-border) accent-(--color-accent)"
                    />
                    Ainda estou cursando
                  </label>
                </>
              ) : (
                <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                  Emitido em
                  <input
                    type="month"
                    value={form.endMonth}
                    onChange={(e) => setForm((f) => ({ ...f, endMonth: e.target.value }))}
                    className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                  />
                </label>
              )}

              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                {formKind === "education" ? "Link (opcional)" : "Link do certificado (opcional)"}
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
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
                {editingId ? "Salvar alterações" : "Adicionar"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
