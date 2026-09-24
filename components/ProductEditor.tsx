"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileArchive, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import {
  PRODUCT_TYPE_LABELS,
  type Product,
  type ProductType,
  type User,
} from "@/lib/types";
import { categories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/client";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import {
  createProduct,
  listProductsForCreator,
  updateProduct,
} from "@/lib/supabase/products";
import { uploadFile } from "@/lib/uploadFile";
import { platformConfig } from "@/lib/security/config";
import { formatBRL } from "@/components/PriceTag";
import { DashboardLoading } from "@/components/DashboardLoading";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";

interface FormState {
  title: string;
  description: string;
  category: string;
  type: ProductType;
  price: string;
  promoPrice: string;
  tagsText: string;
  coverImageUrl: string;
  previewImagesText: string;
  fileUrl: string;
  fileName: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  category: "packs-digitais",
  type: "digital_pack",
  price: "",
  promoPrice: "",
  tagsText: "",
  coverImageUrl: "",
  previewImagesText: "",
  fileUrl: "",
  fileName: "",
};

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function toCents(value: string): number | null {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Math.round(Number(normalized) * 100);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toTags(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function validate(form: FormState, status: "draft" | "approved"): string | null {
  if (form.title.trim().length < 4) return "Dê um nome com pelo menos 4 caracteres.";
  if (form.title.trim().length > 140) return "Deixe o nome com até 140 caracteres.";
  if (!form.category.trim()) return "Escolha uma categoria.";

  const previews = toLines(form.previewImagesText);
  if (previews.length > 8) return "Use no máximo 8 imagens de prévia.";

  const tags = toTags(form.tagsText);
  if (tags.some((tag) => tag.length > 40)) return "Cada palavra-chave pode ter no máximo 40 caracteres.";

  if (status === "approved") {
    if (form.description.trim().length < 20) return "Conte um pouco mais sobre o que a pessoa vai receber.";
    const price = toCents(form.price);
    if (price === null || price <= 0) return "Informe um preço maior que zero.";
    if (!form.fileUrl.trim()) return "Envie o arquivo que o comprador vai receber.";

    const promo = toCents(form.promoPrice);
    if (promo !== null && promo >= price) {
      return "O preço promocional precisa ser menor que o preço normal.";
    }
  }

  return null;
}

export function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [creator, setCreator] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "approved" | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await getCurrentCreatorClient();
        if (!active) return;
        setCreator(current);

        if (!productId) {
          setLoading(false);
          return;
        }

        const products = await listProductsForCreator(supabase, current.id);
        const found = products.find((item) => item.id === productId) ?? null;
        if (!found) throw new Error("Produto não encontrado.");

        if (!active) return;
        setProduct(found);
        setForm({
          title: found.title,
          description: found.description,
          category: found.category,
          type: found.type,
          price: found.price > 0 ? centsToInput(Math.round(found.price * 100)) : "",
          promoPrice: found.promoPrice ? centsToInput(Math.round(found.promoPrice * 100)) : "",
          tagsText: found.tags.join(", "),
          coverImageUrl: found.coverImage,
          previewImagesText: found.previewImages.join("\n"),
          fileUrl: found.fileUrl,
          fileName: found.fileUrl ? "Arquivo atual" : "",
        });
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : "Não foi possível abrir o produto.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [productId, supabase]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleFileUpload(file: File) {
    if (!creator) return;
    setUploadingFile(true);
    setError(null);
    try {
      const url = await uploadFile(file, "product-file", { creatorId: creator.id });
      setForm((current) => ({ ...current, fileUrl: url, fileName: file.name }));
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadFile(file, "product-image");
      setForm((current) => ({ ...current, coverImageUrl: url }));
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a capa.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handlePreviewUpload(files: FileList) {
    const existing = toLines(form.previewImagesText);
    const incoming = Array.from(files);
    if (existing.length + incoming.length > 8) {
      setError("Use no máximo 8 imagens de prévia.");
      return;
    }

    setUploadingPreview(true);
    setError(null);
    try {
      const urls = await Promise.all(incoming.map((file) => uploadFile(file, "product-image")));
      setForm((current) => ({
        ...current,
        previewImagesText: [...toLines(current.previewImagesText), ...urls].join("\n"),
      }));
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    } finally {
      setUploadingPreview(false);
    }
  }

  async function save(status: "draft" | "approved") {
    if (!creator) return;
    const validationError = validate(form, status);
    if (validationError) {
      setError(validationError);
      return;
    }

    const priceCents = toCents(form.price) ?? 0;
    const promoPriceCents = toCents(form.promoPrice);

    setSaving(status);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        tags: toTags(form.tagsText),
        type: form.type,
        priceCents,
        promoPriceCents,
        coverImageUrl: form.coverImageUrl.trim(),
        previewImages: toLines(form.previewImagesText),
        fileUrl: form.fileUrl.trim(),
        status,
      } as const;

      const savedProduct = product
        ? await updateProduct(supabase, product.id, payload)
        : await createProduct(supabase, payload);

      setProduct(savedProduct);
      setSaved(true);

      if (!product) {
        router.replace(`/dashboard/produtos/${savedProduct.id}/editar`);
      }

      if (status === "approved") {
        router.push("/dashboard/produtos");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o produto.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <DashboardLoading />;

  if (loadError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
        <p className="font-semibold text-(--color-text)">Não foi possível abrir esse produto</p>
        <p className="text-sm text-(--color-text-muted)">{loadError}</p>
        <Link href="/dashboard/produtos" className="text-sm font-medium text-(--color-accent-text) hover:underline">
          Voltar para produtos
        </Link>
      </div>
    );
  }

  const priceCents = toCents(form.price) ?? 0;
  const creatorReceives = Math.round(priceCents * platformConfig.creatorRevenueShare);
  const lockedByStatus = Boolean(
    product && product.status !== "draft" && product.status !== "approved",
  );
  const busy = saving !== null || uploadingCover || uploadingPreview || uploadingFile || lockedByStatus;

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        eyebrow="Catálogo"
        title={product ? "Editar produto" : "Novo produto"}
        description="Coloque o essencial primeiro. Você pode salvar como rascunho e terminar depois."
        action={
          <Link
            href="/dashboard/produtos"
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm font-medium text-(--color-text) hover:bg-(--color-surface-2)"
          >
            <ArrowLeft size={14} strokeWidth={1.7} />
            Produtos
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <EditorSection title="O que você está vendendo" description="Escreva de um jeito que a pessoa entenda rápido o que vai receber.">
            <Field label="Nome do produto">
              <input
                value={form.title}
                maxLength={140}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Ex.: Pack com 50 templates para Instagram"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Descrição">
              <textarea
                value={form.description}
                maxLength={3000}
                onChange={(event) => update("description", event.target.value)}
                rows={5}
                placeholder="O que vem no arquivo, para quem serve e como a pessoa pode usar."
                className={INPUT_CLASS}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Categoria">
                <select value={form.category} onChange={(event) => update("category", event.target.value)} className={INPUT_CLASS}>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>{category.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Tipo">
                <select
                  value={form.type}
                  onChange={(event) => update("type", event.target.value as ProductType)}
                  className={INPUT_CLASS}
                >
                  {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Palavras-chave" hint="Separe por vírgula. No máximo 8.">
              <input
                value={form.tagsText}
                onChange={(event) => update("tagsText", event.target.value)}
                placeholder="instagram, social media, templates"
                className={INPUT_CLASS}
              />
            </Field>
          </EditorSection>

          <EditorSection
            title="Arquivo que o comprador recebe"
            description="Esse arquivo só é necessário para publicar. Você pode salvar o rascunho antes de enviá-lo."
          >
            <div className="flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-bg) p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--color-surface-2)">
                <FileArchive size={18} className="text-(--color-accent-text)" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-(--color-text)">
                  {form.fileName || (form.fileUrl ? "Arquivo já enviado" : "Nenhum arquivo enviado")}
                </p>
                <p className="mt-0.5 text-xs text-(--color-text-subtle)">ZIP, PDF, vídeo, áudio ou imagem · até 500 MB</p>
              </div>
              <label className="shrink-0 cursor-pointer rounded-full border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text) hover:bg-(--color-surface-2)">
                {uploadingFile ? "Enviando…" : form.fileUrl ? "Trocar" : "Enviar"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,application/zip,application/x-zip-compressed,video/mp4,audio/mpeg"
                  className="hidden"
                  disabled={uploadingFile}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFileUpload(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </EditorSection>

          <EditorSection title="Preço">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Preço normal">
                <input
                  value={form.price}
                  onChange={(event) => update("price", event.target.value)}
                  inputMode="decimal"
                  placeholder="39,90"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Preço promocional" hint="Opcional">
                <input
                  value={form.promoPrice}
                  onChange={(event) => update("promoPrice", event.target.value)}
                  inputMode="decimal"
                  placeholder="29,90"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            {priceCents > 0 ? (
              <div className="rounded-xl bg-(--color-surface-2) px-3 py-2.5 text-xs leading-relaxed text-(--color-text-muted)">
                Se vender por {formatBRL(priceCents / 100)}, você recebe{" "}
                <strong className="font-semibold text-(--color-text)">{formatBRL(creatorReceives / 100)}</strong>.
                A parte do Jobê é {Math.round(platformConfig.platformRevenueShare * 100)}%.
              </div>
            ) : null}
          </EditorSection>

          <EditorSection title="Imagens" description="A capa é o que aparece primeiro. As prévias ajudam a pessoa a entender o conteúdo.">
            <Field label="Capa">
              <div className="flex gap-2">
                <input
                  value={form.coverImageUrl}
                  onChange={(event) => update("coverImageUrl", event.target.value)}
                  type="url"
                  placeholder="Cole um link ou envie uma imagem"
                  className={`min-w-0 flex-1 ${INPUT_CLASS}`}
                />
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-(--color-border) px-3 py-2.5 text-xs font-medium text-(--color-text) hover:bg-(--color-surface-2)">
                  {uploadingCover ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} strokeWidth={1.6} />}
                  <span className="hidden sm:inline">Enviar</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingCover}
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
              <img src={form.coverImageUrl} alt="" className="h-48 w-full rounded-2xl border border-(--color-border) object-cover" />
            ) : null}

            <Field label="Imagens de prévia" hint="Uma URL por linha ou envie arquivos. No máximo 8.">
              <textarea
                value={form.previewImagesText}
                onChange={(event) => update("previewImagesText", event.target.value)}
                rows={3}
                placeholder={"https://…\nhttps://…"}
                className={INPUT_CLASS}
              />
              <label className="mt-1 flex w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text) hover:bg-(--color-surface-2)">
                {uploadingPreview ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} strokeWidth={1.6} />}
                Enviar imagens
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  disabled={uploadingPreview}
                  onChange={(event) => {
                    if (event.target.files?.length) void handlePreviewUpload(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </Field>
          </EditorSection>

          {error ? (
            <p className="rounded-xl border border-(--color-danger) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-danger)">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-(--color-success)">
              <CheckCircle2 size={15} strokeWidth={1.7} />
              Rascunho salvo.
            </p>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
            <div>
              <p className="text-xs font-medium text-(--color-text-subtle)">Antes de publicar</p>
              {lockedByStatus ? (
                <p className="mt-2 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-3 py-2 text-xs leading-relaxed text-(--color-text-muted)">
                  Este produto está com um status administrativo e não pode ser alterado ou republicado por aqui.
                </p>
              ) : null}
              <ul className="mt-2 space-y-2 text-sm text-(--color-text-muted)">
                <Checklist done={form.title.trim().length >= 4}>Nome do produto</Checklist>
                <Checklist done={form.description.trim().length >= 20}>Descrição clara</Checklist>
                <Checklist done={priceCents > 0}>Preço definido</Checklist>
                <Checklist done={Boolean(form.fileUrl.trim())}>Arquivo enviado</Checklist>
              </ul>
            </div>

            <div className="border-t border-(--color-border) pt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => void save("approved")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover) disabled:opacity-50"
              >
                {saving === "approved" ? <Loader2 size={14} className="animate-spin" /> : null}
                {product?.status === "approved" ? "Salvar alterações" : "Publicar produto"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save("draft")}
                className="mt-2 w-full rounded-full border border-(--color-border) px-4 py-2.5 text-sm font-medium text-(--color-text) hover:bg-(--color-surface-2) disabled:opacity-50"
              >
                {saving === "draft" ? "Salvando…" : product?.status === "approved" ? "Despublicar e salvar" : "Salvar rascunho"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const INPUT_CLASS =
  "w-full rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-base text-(--color-text) placeholder:text-(--color-text-subtle) focus:border-(--color-accent-text) focus:outline-none sm:text-sm";

function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
      <div>
        <h2 className="font-semibold text-(--color-text)">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-relaxed text-(--color-text-muted)">{description}</p> : null}
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

function Checklist({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${done ? "bg-(--color-accent)" : "bg-(--color-border)"}`}
        aria-hidden="true"
      />
      <span className={done ? "text-(--color-text)" : undefined}>{children}</span>
    </li>
  );
}
