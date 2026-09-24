"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  GAMING_GIG_CATEGORIES,
  GIG_CATEGORY_LABELS,
  type Gig,
  type GigCategory,
  type User,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import {
  createGig,
  deleteGig,
  listGigsForCreator,
  updateGig,
  type GigInput,
} from "@/lib/supabase/gigs";
import { uploadFile } from "@/lib/uploadFile";
import { PriceTag, formatBRL } from "@/components/PriceTag";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { DashboardLoading } from "@/components/DashboardLoading";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { platformConfig } from "@/lib/security/config";

const NON_GAMING_CATEGORIES = Object.keys(GIG_CATEGORY_LABELS).filter(
  (category) => !GAMING_GIG_CATEGORIES.includes(category as GigCategory),
) as GigCategory[];

type Filter = "all" | "active" | "paused";

interface FormState {
  title: string;
  description: string;
  price: string;
  deliveryDays: string;
  coverImageUrl: string;
  galleryText: string;
  revisionCount: string;
  includedItemsText: string;
  status: "active" | "paused";
  category: GigCategory;
  game: string;
  platform: string;
  sessionMinutes: string;
  currentRank: string;
  targetRank: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  price: "",
  deliveryDays: "",
  coverImageUrl: "",
  galleryText: "",
  revisionCount: "",
  includedItemsText: "",
  status: "active",
  category: "general",
  game: "",
  platform: "",
  sessionMinutes: "",
  currentRank: "",
  targetRank: "",
};

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function inputToCents(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Math.round(parseFloat(normalized) * 100);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}


function isHttpsUrl(value: string): boolean {
  if (!value.trim()) return true;
  if (value.length > 2048) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function validateForm(form: FormState): string | null {
  if (form.title.trim().length < 6) return "Explique melhor o que você vai fazer.";
  if (form.title.trim().length > 140) return "Deixe o título com até 140 caracteres.";
  if (form.description.trim().length < 20) return "Conte um pouco mais sobre como o serviço funciona.";
  if (inputToCents(form.price) <= 0) return "Informe um preço maior que zero.";

  const revisionCount = form.revisionCount.trim() ? Number(form.revisionCount) : null;
  if (revisionCount !== null && (!Number.isInteger(revisionCount) || revisionCount < 0 || revisionCount > 50)) {
    return "Confira a quantidade de revisões.";
  }

  const included = toLines(form.includedItemsText);
  if (included.length > 8) return "Use no máximo 8 itens em “O que está incluso”.";

  if (!isHttpsUrl(form.coverImageUrl)) {
    return "A capa precisa usar um link https:// válido.";
  }

  const gallery = toLines(form.galleryText);
  if (gallery.length > 8) return "Use no máximo 8 imagens extras.";
  if (gallery.some((url) => !isHttpsUrl(url))) {
    return "As imagens extras precisam usar links https:// válidos.";
  }

  if (form.category === "elojob") {
    if (!form.game.trim() || !form.currentRank.trim() || !form.targetRank.trim()) {
      return "Informe o jogo, o elo atual e o elo desejado.";
    }
    const days = Number(form.deliveryDays);
    if (!Number.isInteger(days) || days < 1) return "Informe um prazo válido.";
  }

  if (form.category === "play_together") {
    if (!form.game.trim()) return "Informe o jogo.";
    const minutes = Number(form.sessionMinutes);
    if (!Number.isInteger(minutes) || minutes < 15) return "A sessão precisa ter pelo menos 15 minutos.";
  }

  if (form.category !== "play_together" && form.deliveryDays.trim()) {
    const days = Number(form.deliveryDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) return "Confira o prazo em dias.";
  }

  return null;
}

export default function DashboardServicosPage() {
  const supabase = createClient();
  const [creator, setCreator] = useState<User | null>(null);
  const [gigs, setGigs] = useState<Gig[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Gig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await getCurrentCreatorClient();
        const rows = await listGigsForCreator(supabase, current.id);
        if (!active) return;
        setCreator(current);
        setGigs(rows);
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Não foi possível carregar seus serviços.");
        setGigs([]);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleGigs = useMemo(() => {
    const rows = gigs ?? [];
    return filter === "all" ? rows : rows.filter((gig) => gig.status === filter);
  }, [filter, gigs]);

  const activeCount = (gigs ?? []).filter((gig) => gig.status === "active").length;
  const pausedCount = (gigs ?? []).filter((gig) => gig.status === "paused").length;

  if (gigs === null) return <DashboardLoading />;

  function closeForm() {
    if (saving || uploadingCover || uploadingGallery) return;
    setShowForm(false);
    setError(null);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(gig: Gig) {
    setEditingId(gig.id);
    setForm({
      title: gig.title,
      description: gig.description,
      price: centsToInput(gig.priceCents),
      deliveryDays: gig.deliveryDays ? String(gig.deliveryDays) : "",
      coverImageUrl: gig.coverImageUrl ?? "",
      galleryText: gig.galleryUrls.join("\n"),
      revisionCount: gig.revisionCount !== undefined ? String(gig.revisionCount) : "",
      includedItemsText: gig.includedItems.join("\n"),
      status: gig.status,
      category: gig.category,
      game: gig.game ?? "",
      platform: gig.platform ?? "",
      sessionMinutes: gig.sessionMinutes ? String(gig.sessionMinutes) : "",
      currentRank: gig.currentRank ?? "",
      targetRank: gig.targetRank ?? "",
    });
    setError(null);
    setShowForm(true);
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadFile(file, "portfolio-image");
      setForm((current) => ({ ...current, coverImageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGalleryUpload(files: FileList) {
    const current = toLines(form.galleryText);
    const incoming = Array.from(files);
    if (current.length + incoming.length > 8) {
      setError("Use no máximo 8 imagens extras.");
      return;
    }

    setUploadingGallery(true);
    setError(null);
    try {
      const urls = await Promise.all(incoming.map((file) => uploadFile(file, "portfolio-image")));
      setForm((state) => ({
        ...state,
        galleryText: [...toLines(state.galleryText), ...urls].join("\n"),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const input: GigInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      priceCents: inputToCents(form.price),
      deliveryDays:
        form.category !== "play_together" && form.deliveryDays.trim()
          ? Number(form.deliveryDays)
          : null,
      coverImageUrl: form.coverImageUrl.trim(),
      category: form.category,
      game: form.game.trim(),
      platform: form.platform.trim(),
      sessionMinutes: form.sessionMinutes.trim() ? Number(form.sessionMinutes) : null,
      currentRank: form.currentRank.trim(),
      targetRank: form.targetRank.trim(),
      revisionCount: form.revisionCount.trim() ? Number(form.revisionCount) : null,
      includedItems: toLines(form.includedItemsText),
      galleryUrls: toLines(form.galleryText),
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await updateGig(supabase, editingId, { ...input, status: form.status });
        setGigs((current) => (current ?? []).map((gig) => (gig.id === editingId ? updated : gig)));
      } else {
        const created = await createGig(supabase, input);
        setGigs((current) => [...(current ?? []), created]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o serviço.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePause(gig: Gig) {
    setBusyId(gig.id);
    setError(null);
    try {
      const updated = await updateGig(supabase, gig.id, {
        title: gig.title,
        description: gig.description,
        priceCents: gig.priceCents,
        deliveryDays: gig.deliveryDays,
        coverImageUrl: gig.coverImageUrl ?? "",
        category: gig.category,
        game: gig.game ?? "",
        platform: gig.platform ?? "",
        sessionMinutes: gig.sessionMinutes ?? null,
        currentRank: gig.currentRank ?? "",
        targetRank: gig.targetRank ?? "",
        revisionCount: gig.revisionCount ?? null,
        includedItems: gig.includedItems,
        galleryUrls: gig.galleryUrls,
        status: gig.status === "active" ? "paused" : "active",
      });
      setGigs((current) => (current ?? []).map((item) => (item.id === gig.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível mudar o status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(gig: Gig) {
    setBusyId(gig.id);
    setError(null);
    try {
      await deleteGig(supabase, gig.id);
      setGigs((current) => (current ?? []).filter((item) => item.id !== gig.id));
      setDeleteCandidate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o serviço.");
      setDeleteCandidate(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Catálogo"
        title="Serviços"
        description="Mostre o que você sabe fazer. Quem se interessar chama você e vocês acertam os detalhes pela conversa."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
          >
            <Plus size={15} strokeWidth={1.8} />
            Novo serviço
          </button>
        }
      />

      {loadError ? (
        <div className="rounded-xl border border-(--color-danger) bg-(--color-surface) px-4 py-3 text-sm text-(--color-danger)">
          {loadError}
        </div>
      ) : null}

      {error && !showForm ? (
        <div className="rounded-xl border border-(--color-danger) bg-(--color-surface) px-4 py-3 text-sm text-(--color-danger)">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          Todos {gigs.length}
        </FilterButton>
        <FilterButton active={filter === "active"} onClick={() => setFilter("active")}>
          Ativos {activeCount}
        </FilterButton>
        <FilterButton active={filter === "paused"} onClick={() => setFilter("paused")}>
          Pausados {pausedCount}
        </FilterButton>
      </div>

      {gigs.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
          <p className="font-semibold text-(--color-text)">Você ainda não publicou nenhum serviço</p>
          <p className="max-w-lg text-sm leading-relaxed text-(--color-text-muted)">
            Crie uma oferta simples dizendo o que você faz, quanto custa e em quanto tempo costuma entregar.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="text-sm font-medium text-(--color-accent-text) hover:underline"
          >
            Criar primeiro serviço
          </button>
        </div>
      ) : visibleGigs.length === 0 ? (
        <p className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-8 text-sm text-(--color-text-muted)">
          Nenhum serviço nesse filtro.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleGigs.map((gig) => (
            <article
              key={gig.id}
              className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 shadow-sm sm:flex-row sm:items-center"
            >
              {gig.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gig.coverImageUrl}
                  alt=""
                  className="h-32 w-full rounded-xl object-cover sm:h-20 sm:w-24 sm:shrink-0"
                />
              ) : (
                <MediaPlaceholder
                  seed={gig.id}
                  className="h-32 w-full rounded-xl sm:h-20 sm:w-24 sm:shrink-0"
                  label={gig.title}
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-(--color-text)">{gig.title}</p>
                    <p className="mt-0.5 text-xs font-medium text-(--color-accent-text)">
                      {GIG_CATEGORY_LABELS[gig.category]}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium ${
                      gig.status === "active" ? "text-(--color-accent-text)" : "text-(--color-text-subtle)"
                    }`}
                  >
                    {gig.status === "active" ? "Ativo" : "Pausado"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--color-text-subtle)">
                  <PriceTag price={gig.priceCents / 100} size="sm" />
                  {gig.deliveryDays ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} strokeWidth={1.5} />
                      {gig.deliveryDays} {gig.deliveryDays === 1 ? "dia" : "dias"}
                    </span>
                  ) : null}
                  {gig.revisionCount !== undefined ? (
                    <span>
                      {gig.revisionCount === 0
                        ? "Sem revisões"
                        : `${gig.revisionCount} ${gig.revisionCount === 1 ? "revisão" : "revisões"}`}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-(--color-border) pt-3 sm:justify-end sm:border-0 sm:pt-0">
                <button
                  type="button"
                  disabled={busyId === gig.id}
                  onClick={() => void handleTogglePause(gig)}
                  className="rounded-full border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text) disabled:opacity-60"
                >
                  {busyId === gig.id ? "Salvando…" : gig.status === "active" ? "Pausar" : "Reativar"}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(gig)}
                  aria-label={`Editar ${gig.title}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-text-subtle) hover:bg-(--color-surface-2) hover:text-(--color-text)"
                >
                  <Pencil size={15} strokeWidth={1.6} />
                </button>
                <button
                  type="button"
                  disabled={busyId === gig.id}
                  onClick={() => setDeleteCandidate(gig)}
                  aria-label={`Excluir ${gig.title}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-text-subtle) hover:bg-(--color-surface-2) hover:text-(--color-danger) disabled:opacity-60"
                >
                  <Trash2 size={15} strokeWidth={1.6} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Fechar"
            onClick={closeForm}
            className="absolute inset-0 bg-(--color-contrast) opacity-55"
          />
          <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-(--color-border) bg-(--color-surface) shadow-lg sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-(--color-border) px-4 py-4 sm:px-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-subtle)">
                  {editingId ? "Editar serviço" : "Novo serviço"}
                </p>
                <h2 className="mt-0.5 text-lg font-semibold text-(--color-text)">
                  {editingId ? "Ajuste o que precisar" : "O que você quer oferecer?"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving || uploadingCover || uploadingGallery}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-text-subtle) hover:bg-(--color-surface-2) hover:text-(--color-text) disabled:opacity-50"
              >
                <X size={18} strokeWidth={1.6} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-6 p-4 sm:p-5">
                <FormSection title="Serviço" description="Explique de um jeito que qualquer pessoa entenda.">
                  <Field label="Categoria">
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, category: event.target.value as GigCategory }))
                      }
                      className={INPUT_CLASS}
                    >
                      {NON_GAMING_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {GIG_CATEGORY_LABELS[category]}
                        </option>
                      ))}
                      <option value="elojob">{GIG_CATEGORY_LABELS.elojob}</option>
                      <option value="play_together">{GIG_CATEGORY_LABELS.play_together}</option>
                    </select>
                  </Field>

                  {GAMING_GIG_CATEGORIES.includes(form.category) ? (
                    <div className="grid gap-3 rounded-2xl bg-(--color-surface-2) p-3 sm:grid-cols-2">
                      <Field label="Jogo">
                        <input
                          value={form.game}
                          onChange={(event) => setForm((current) => ({ ...current, game: event.target.value }))}
                          placeholder="Ex.: Valorant"
                          className={INPUT_CLASS_ON_SURFACE}
                        />
                      </Field>
                      <Field label="Plataforma ou região">
                        <input
                          value={form.platform}
                          onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))}
                          placeholder="Ex.: PC · Brasil"
                          className={INPUT_CLASS_ON_SURFACE}
                        />
                      </Field>

                      {form.category === "elojob" ? (
                        <>
                          <Field label="Elo atual">
                            <input
                              value={form.currentRank}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, currentRank: event.target.value }))
                              }
                              placeholder="Ex.: Prata 2"
                              className={INPUT_CLASS_ON_SURFACE}
                            />
                          </Field>
                          <Field label="Elo desejado">
                            <input
                              value={form.targetRank}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, targetRank: event.target.value }))
                              }
                              placeholder="Ex.: Diamante"
                              className={INPUT_CLASS_ON_SURFACE}
                            />
                          </Field>
                        </>
                      ) : (
                        <div className="sm:col-span-2">
                          <Field label="Duração da sessão">
                            <input
                              value={form.sessionMinutes}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, sessionMinutes: event.target.value }))
                              }
                              type="number"
                              min={15}
                              step={15}
                              inputMode="numeric"
                              placeholder="Ex.: 60 minutos"
                              className={INPUT_CLASS_ON_SURFACE}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <Field label="O que você vai fazer" hint="Escreva como a pessoa vai ver no anúncio.">
                    <input
                      value={form.title}
                      maxLength={140}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Ex.: Vou criar a identidade visual da sua marca"
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <Field label="Como funciona">
                    <textarea
                      value={form.description}
                      maxLength={2000}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={4}
                      placeholder="Conte o que você precisa receber do cliente, como trabalha e o que ele pode esperar."
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <Field label="O que está incluso" hint="Uma linha por item. No máximo 8.">
                    <textarea
                      value={form.includedItemsText}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, includedItemsText: event.target.value }))
                      }
                      rows={3}
                      placeholder={"Arquivo final\n2 rodadas de ajuste\nEntrega em alta resolução"}
                      className={INPUT_CLASS}
                    />
                  </Field>
                </FormSection>

                <FormSection title="Preço e prazo" description="Valores indicativos. O combinado final acontece na conversa.">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label={form.category === "play_together" ? "Preço da sessão" : "Preço a partir de"}>
                      <input
                        value={form.price}
                        onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                        inputMode="decimal"
                        placeholder="150,00"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Prazo em dias">
                      <input
                        value={form.deliveryDays}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, deliveryDays: event.target.value }))
                        }
                        type="number"
                        min={1}
                        max={365}
                        inputMode="numeric"
                        disabled={form.category === "play_together"}
                        placeholder={form.category === "play_together" ? "Não se aplica" : "Ex.: 5"}
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Revisões">
                      <input
                        value={form.revisionCount}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, revisionCount: event.target.value }))
                        }
                        type="number"
                        min={0}
                        max={50}
                        inputMode="numeric"
                        placeholder="Ex.: 2"
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>

                  {inputToCents(form.price) > 0 ? (
                    <div className="rounded-xl bg-(--color-surface-2) px-3 py-2.5 text-xs leading-relaxed text-(--color-text-muted)">
                      Se fechar nesse valor, você recebe{" "}
                      <strong className="font-semibold text-(--color-text)">
                        {formatBRL((inputToCents(form.price) * platformConfig.creatorRevenueShare) / 100)}
                      </strong>
                      . A parte do Jobê é {Math.round(platformConfig.platformRevenueShare * 100)}%.
                    </div>
                  ) : null}
                </FormSection>

                <FormSection title="Imagens" description="Uma boa capa ajuda a pessoa a entender o serviço antes de abrir.">
                  <Field label="Imagem de capa">
                    <div className="flex gap-2">
                      <input
                        value={form.coverImageUrl}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, coverImageUrl: event.target.value }))
                        }
                        type="url"
                        placeholder="Cole um link ou envie uma imagem"
                        className={`min-w-0 flex-1 ${INPUT_CLASS}`}
                      />
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm font-medium text-(--color-text) hover:bg-(--color-surface-2)">
                        {uploadingCover ? (
                          <Loader2 size={14} className="animate-spin" strokeWidth={1.6} />
                        ) : (
                          <Upload size={14} strokeWidth={1.6} />
                        )}
                        <span className="hidden sm:inline">Enviar</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleCoverUpload(file);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </Field>

                  {form.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.coverImageUrl}
                      alt=""
                      className="h-40 w-full rounded-2xl border border-(--color-border) object-cover"
                    />
                  ) : null}

                  <Field label="Mais imagens" hint="Uma URL por linha ou envie arquivos. No máximo 8.">
                    <textarea
                      value={form.galleryText}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, galleryText: event.target.value }))
                      }
                      rows={3}
                      placeholder={"https://…\nhttps://…"}
                      className={INPUT_CLASS}
                    />
                    <label className="mt-1 flex w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text) hover:bg-(--color-surface-2)">
                      {uploadingGallery ? (
                        <Loader2 size={13} className="animate-spin" strokeWidth={1.6} />
                      ) : (
                        <Upload size={13} strokeWidth={1.6} />
                      )}
                      Enviar imagens
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          if (event.target.files?.length) void handleGalleryUpload(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </Field>
                </FormSection>

                {editingId ? (
                  <FormSection title="Visibilidade">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, status: "active" }))}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${
                          form.status === "active"
                            ? "border-(--color-contrast) bg-(--color-contrast) text-(--color-on-contrast)"
                            : "border-(--color-border) text-(--color-text-muted)"
                        }`}
                      >
                        Ativo
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, status: "paused" }))}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${
                          form.status === "paused"
                            ? "border-(--color-contrast) bg-(--color-contrast) text-(--color-on-contrast)"
                            : "border-(--color-border) text-(--color-text-muted)"
                        }`}
                      >
                        Pausado
                      </button>
                    </div>
                  </FormSection>
                ) : null}

                {error ? (
                  <p className="rounded-xl border border-(--color-danger) px-3 py-2.5 text-sm text-(--color-danger)">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-(--color-border) bg-(--color-surface) px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving || uploadingCover || uploadingGallery}
                  className="rounded-full border border-(--color-border) px-4 py-2.5 text-sm text-(--color-text) disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingCover || uploadingGallery}
                  className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" strokeWidth={1.6} /> : null}
                  {editingId ? "Salvar" : "Publicar serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Cancelar exclusão"
            onClick={() => setDeleteCandidate(null)}
            className="absolute inset-0 bg-(--color-contrast) opacity-55"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-(--color-text)">Excluir este serviço?</h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">
              “{deleteCandidate.title}” deixa de aparecer para você e para quem estiver procurando serviços.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-full border border-(--color-border) px-4 py-2 text-sm text-(--color-text)"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busyId === deleteCandidate.id}
                onClick={() => void handleDelete(deleteCandidate)}
                className="inline-flex items-center gap-1.5 rounded-full border border-(--color-danger) bg-(--color-surface) px-4 py-2 text-sm font-semibold text-(--color-danger) disabled:opacity-60"
              >
                {busyId === deleteCandidate.id ? <Loader2 size={14} className="animate-spin" /> : null}
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const INPUT_CLASS =
  "w-full rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base text-(--color-text) placeholder:text-(--color-text-subtle) focus:border-(--color-accent-text) focus:outline-none disabled:opacity-55 sm:text-sm";

const INPUT_CLASS_ON_SURFACE =
  "w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-base text-(--color-text) placeholder:text-(--color-text-subtle) focus:border-(--color-accent-text) focus:outline-none sm:text-sm";

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? "border-(--color-contrast) bg-(--color-contrast) text-(--color-on-contrast)"
          : "border-(--color-border) bg-(--color-surface) text-(--color-text-muted)"
      }`}
    >
      {children}
    </button>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-(--color-text)">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-(--color-text-muted)">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm text-(--color-text)">
      <span className="font-medium">{label}</span>
      {hint ? <span className="text-xs font-normal text-(--color-text-subtle)">{hint}</span> : null}
      {children}
    </div>
  );
}
