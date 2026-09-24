"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { prepareCoverUpload } from "@/lib/uploadFile";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";

interface CoverResponse {
  url?: string;
  error?: string;
}

export function ProfileCoverEditor({
  userId,
  displayName,
  initialUrl,
  editable = false,
}: {
  userId: string;
  displayName: string;
  initialUrl?: string | null;
  editable?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setError("A imagem pode ter no máximo 10 MB.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const prepared = await prepareCoverUpload(file);
      const body = new FormData();
      body.set("file", prepared);

      const response = await fetch("/api/profile/cover", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as CoverResponse;
      if (!response.ok || !result.url) {
        throw new Error(result.error || "Não foi possível trocar a imagem.");
      }

      setUrl(result.url);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível trocar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/cover", { method: "DELETE" });
      const result = (await response.json()) as CoverResponse;
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível remover a imagem.");
      }

      setUrl("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível remover a imagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface-2) sm:h-64">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={`Imagem de destaque de ${displayName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <MediaPlaceholder
            seed={`${userId}-magazine`}
            className="h-full w-full"
            label={`Destaque de ${displayName}`}
            flush
          />
        )}

        {editable && !busy ? (
          <div className="absolute bottom-3 left-3 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-(--color-contrast) px-3 py-2 text-xs font-semibold text-(--color-on-contrast) shadow-sm"
            >
              {url ? "Trocar imagem" : "Adicionar imagem"}
            </button>
            {url ? (
              <button
                type="button"
                onClick={() => void handleRemove()}
                className="rounded-full bg-(--color-surface) px-3 py-2 text-xs font-medium text-(--color-text) shadow-sm"
              >
                Remover
              </button>
            ) : null}
          </div>
        ) : null}

        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-(--color-contrast) text-(--color-on-contrast) opacity-80">
            <Loader2 size={22} className="animate-spin" strokeWidth={1.5} />
          </div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
      </div>

      {error ? <p className="text-xs text-(--color-danger)">{error}</p> : null}
    </div>
  );
}
