import { ImageIcon, PlayCircle, User } from "lucide-react";

/**
 * Nesta fase de mock não há upload/armazenamento real de mídia (ver
 * lib/payments/MediaStorageProvider.ts). Este componente renderiza um
 * placeholder neutro e determinístico a partir de um seed, no lugar de
 * imagens reais.
 */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const TONES = [
  "bg-(--color-surface-2)",
  "bg-(--color-surface)",
];

export function MediaPlaceholder({
  seed,
  kind = "image",
  className = "",
  label,
}: {
  seed: string;
  kind?: "image" | "video" | "avatar";
  className?: string;
  label?: string;
}) {
  const hash = hashSeed(seed);
  const tone = TONES[hash % TONES.length];

  if (kind === "avatar") {
    return (
      <div
        className={`flex items-center justify-center rounded-full border border-(--color-border) ${tone} ${className}`}
        aria-label={label ?? "Avatar"}
      >
        <User className="h-1/2 w-1/2 text-(--color-text-subtle)" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-md border border-(--color-border) ${tone} ${className}`}
      aria-label={label ?? "Prévia de conteúdo"}
    >
      {kind === "video" ? (
        <PlayCircle className="relative h-8 w-8 text-(--color-text-subtle)" strokeWidth={1.5} />
      ) : (
        <ImageIcon className="relative h-8 w-8 text-(--color-text-subtle)" strokeWidth={1.5} />
      )}
    </div>
  );
}
