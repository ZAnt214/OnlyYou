"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2, Megaphone, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import type { Gig, User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { createGig, deleteGig, listGigsForCreator, updateGig, type GigInput } from "@/lib/supabase/gigs";
import { uploadFile } from "@/lib/uploadFile";
import { PriceTag } from "@/components/PriceTag";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { DashboardLoading } from "@/components/DashboardLoading";

interface FormState {
  title: string;
  description: string;
  price: string;
  deliveryDays: string;
  coverImageUrl: string;
  status: "active" | "paused";
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  price: "",
  deliveryDays: "",
  coverImageUrl: "",
  status: "active",
};

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function inputToCents(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Math.round(parseFloat(normalized) * 100);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

/**
 * Painel de gigs do criador — anúncios "vou fazer X pra você" que aparecem
 * no feed inicial e na busca para qualquer visitante. Mesmo padrão de
 * PortfolioSection: lista + modal de formulário, escrita sempre via RPC.
 * Diferente do portfólio, isso não fica embutido no perfil público — é uma
 * tela própria do painel, já que é conteúdo promocional, não um trabalho
 * já feito para mostrar no perfil.
 */
export default function DashboardServicosPage() {
  const supabase = createClient();
  const [creator, setCreator] = useState<User | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await getCurrentCreatorClient();
      setCreator(c);
      setGigs(await listGigsForCreator(supabase, c.id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!creator) return <DashboardLoading />;

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
      status: gig.status,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadFile(file, "portfolio-image");
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const input: GigInput = {
      title: form.title,
      description: form.description,
      priceCents: inputToCents(form.price),
      deliveryDays: form.deliveryDays.trim() ? Number(form.deliveryDays) : null,
      coverImageUrl: form.coverImageUrl,
    };
    try {
      if (editingId) {
        const updated = await updateGig(supabase, editingId, { ...input, status: form.status });
        setGigs((prev) => prev.map((g) => (g.id === editingId ? updated : g)));
      } else {
        const created = await createGig(supabase, input);
        setGigs((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o anúncio.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTogglePause(gig: Gig) {
    setBusy(true);
    try {
      const updated = await updateGig(supabase, gig.id, {
        title: gig.title,
        description: gig.description,
        priceCents: gig.priceCents,
        deliveryDays: gig.deliveryDays,
        coverImageUrl: gig.coverImageUrl ?? "",
        status: gig.status === "active" ? "paused" : "active",
      });
      setGigs((prev) => prev.map((g) => (g.id === gig.id ? updated : g)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o anúncio.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await deleteGig(supabase, id);
      setGigs((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o anúncio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-(--color-text)">Serviços</h1>
          <p className="text-sm text-(--color-text-muted)">
            Anúncios do tipo &quot;vou fazer X pra você&quot; — aparecem no feed inicial e na busca.
            Quem se interessar solicita e vocês acertam os detalhes na conversa antes de fechar.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex shrink-0 items-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
        >
          <Plus size={14} strokeWidth={1.5} />
          Novo anúncio
        </button>
      </div>

      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

      {gigs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-surface-2) text-(--color-text-muted)">
            <Megaphone size={28} strokeWidth={1.5} />
          </span>
          <p className="text-sm text-(--color-text-muted)">Nenhum serviço anunciado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 shadow-sm"
            >
              {gig.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gig.coverImageUrl}
                  alt={gig.title}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <MediaPlaceholder seed={gig.id} className="h-16 w-16 shrink-0" label={gig.title} />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-(--color-text)">{gig.title}</span>
                <div className="flex items-center gap-2 text-xs text-(--color-text-subtle)">
                  <PriceTag price={gig.priceCents / 100} size="sm" />
                  {gig.deliveryDays ? (
                    <span className="flex items-center gap-1">
                      <Clock size={11} strokeWidth={1.5} />
                      {gig.deliveryDays}d
                    </span>
                  ) : null}
                  <span
                    className={
                      gig.status === "active"
                        ? "rounded-md bg-(--color-accent-soft) px-2 py-0.5 text-(--color-accent)"
                        : "rounded-md bg-(--color-surface-2) px-2 py-0.5 text-(--color-text-muted)"
                    }
                  >
                    {gig.status === "active" ? "Ativo" : "Pausado"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTogglePause(gig)}
                  disabled={busy}
                  className="rounded-md px-2 py-1 text-xs font-medium text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text) disabled:opacity-60"
                >
                  {gig.status === "active" ? "Pausar" : "Reativar"}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(gig)}
                  aria-label="Editar"
                  className="p-1.5 text-(--color-text-subtle) hover:text-(--color-text)"
                >
                  <Pencil size={14} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(gig.id)}
                  aria-label="Excluir"
                  className="p-1.5 text-(--color-text-subtle) hover:text-(--color-danger)"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl bg-(--color-surface) shadow-lg shadow-black/10">
            <div className="flex items-center justify-between gap-3 p-5 pb-0">
              <h2 className="flex items-center gap-1.5 text-base font-semibold text-(--color-text)">
                <Megaphone size={16} strokeWidth={1.5} />
                {editingId ? "Editar anúncio" : "Novo anúncio"}
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-y-auto p-5">
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                O que você vai fazer
                <span className="text-xs font-normal text-(--color-text-subtle)">
                  Escreva em primeira pessoa — é assim que aparece no feed.
                </span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="Ex.: Vou criar o logo da sua marca"
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Descrição
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="O que está incluído, como funciona, o que você precisa do cliente para começar."
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </label>
              <div className="flex gap-2">
                <label className="flex flex-1 flex-col gap-1 text-sm text-(--color-text)">
                  Preço a partir de (R$)
                  <input
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    required
                    inputMode="decimal"
                    placeholder="150,00"
                    className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm text-(--color-text)">
                  Prazo estimado (dias)
                  <input
                    value={form.deliveryDays}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryDays: e.target.value }))}
                    inputMode="numeric"
                    placeholder="Ex.: 5"
                    className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                  />
                </label>
              </div>
              <p className="text-xs text-(--color-text-subtle)">
                Preço e prazo são indicativos — o valor final é combinado na conversa antes do
                pagamento, igual a qualquer pedido personalizado.
              </p>
              <label className="flex flex-col gap-1 text-sm text-(--color-text)">
                Imagem de capa (opcional)
                <div className="flex items-center gap-2">
                  <input
                    value={form.coverImageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
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
              </label>

              {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

              <button
                type="submit"
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-(--radius-pill) bg-(--color-accent) px-4 py-2.5 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" strokeWidth={1.5} /> : null}
                {editingId ? "Salvar alterações" : "Publicar anúncio"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
