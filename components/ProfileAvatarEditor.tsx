"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/uploadFile";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";

export function ProfileAvatarEditor({
  userId,
  displayName,
  initialUrl,
  editable = false,
  sizeClassName = "h-16 w-16",
}: {
  userId: string;
  displayName: string;
  initialUrl?: string | null;
  editable?: boolean;
  sizeClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateAvatar(nextUrl: string) {
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("update_creator_avatar", {
      p_avatar_url: nextUrl,
    });
    if (rpcError) throw new Error(rpcError.message);
  }

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const nextUrl = await uploadFile(file, "avatar-image");
      await updateAvatar(nextUrl);
      setUrl(nextUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível trocar a foto.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      await updateAvatar("");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível remover a foto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className={`relative overflow-hidden rounded-full border-2 border-(--color-border) bg-(--color-surface-2) ${sizeClassName}`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`Foto de perfil de ${displayName}`} className="h-full w-full object-cover" />
        ) : (
          <MediaPlaceholder
            seed={userId}
            kind="avatar"
            label={displayName}
            flush
            className="h-full w-full"
          />
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-(--color-contrast) text-(--color-on-contrast) opacity-80">
            <Loader2 size={18} className="animate-spin" strokeWidth={1.5} />
          </div>
        ) : null}
      </div>

      {editable ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-(--color-accent-text) hover:underline disabled:opacity-60"
          >
            {url ? "Trocar foto" : "Adicionar foto"}
          </button>
          {url ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRemove()}
              className="text-xs text-(--color-text-muted) hover:text-(--color-text) disabled:opacity-60"
            >
              Remover
            </button>
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
      ) : null}

      {error ? <p className="max-w-48 text-xs text-(--color-danger)">{error}</p> : null}
    </div>
  );
}
