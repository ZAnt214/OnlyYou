import { upload } from "@vercel/blob/client";

const IMAGE_MAX_DIMENSION = 1920;
const IMAGE_QUALITY = 0.82;

/**
 * Recompacta imagem no navegador antes do upload — redimensiona pro maior
 * lado caber em IMAGE_MAX_DIMENSION e reencoda em JPEG. Reduz o tamanho do
 * arquivo (storage + tempo de upload) sem precisar de nenhuma lib nova.
 * Não mexe em GIF (perderia a animação) nem em nada que não seja imagem —
 * a entrega de pedido pode ser zip/pdf, e recompactar isso no navegador
 * não ajudaria (e corromperia zip).
 */
async function compressImageIfPossible(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", IMAGE_QUALITY),
    );
    // Só troca pelo arquivo comprimido se ele for realmente menor —
    // uma imagem já pequena/otimizada pode crescer ao reencodar.
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^./\\]+$/, "") || "imagem";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    // Formato que o navegador não conseguiu decodificar, etc. — sobe o
    // arquivo original em vez de travar o upload por causa da compressão.
    return file;
  }
}

/** Remove separador de caminho e caracteres fora de um conjunto seguro. */
function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() || "arquivo";
  const safe = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+/, "");
  return (safe || "arquivo").slice(-120);
}

export type UploadKind = "delivery" | "portfolio-image";

/**
 * Upload real de arquivo (Vercel Blob) direto do navegador — a rota
 * /api/upload só autoriza e limita tipo/tamanho (por `kind`, ver lá), o
 * arquivo em si nunca passa pelo nosso servidor. Devolve a URL pública
 * definitiva do arquivo.
 */
export async function uploadFile(file: File, kind: UploadKind): Promise<string> {
  const toUpload = kind === "portfolio-image" ? await compressImageIfPossible(file) : file;
  const blob = await upload(sanitizeFileName(toUpload.name), toUpload, {
    access: "public",
    handleUploadUrl: "/api/upload",
    clientPayload: JSON.stringify({ kind }),
  });
  return blob.url;
}
