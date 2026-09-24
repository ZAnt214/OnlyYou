import { upload } from "@vercel/blob/client";

function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() || "arquivo";
  const safe = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+/, "");
  return (safe || "arquivo").slice(-120);
}

export type UploadKind = "delivery" | "portfolio-image" | "product-image" | "product-file";

export interface UploadContext {
  creatorId?: string;
  customServiceOrderId?: string;
}

const UPLOAD_TIMEOUT_MS = 60_000;
const CREATOR_IMAGE_TIMEOUT_MS = 45_000;

async function prepareCreatorImage(file: File): Promise<File> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Use uma imagem PNG, JPG ou WebP.");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("A imagem pode ter no máximo 25 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const maxSide = 1920;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem.");

    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Não foi possível preparar a imagem."))),
        "image/webp",
        0.86,
      );
    });

    // Route Handlers da Vercel têm limite de payload. Mantemos folga para
    // multipart/form-data; no servidor a imagem será validada e reencodada de novo.
    if (blob.size > 3.5 * 1024 * 1024) {
      throw new Error("A imagem ficou grande demais. Tente uma imagem menor.");
    }
    return new File([blob], "imagem.webp", { type: "image/webp", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}

async function uploadCreatorImage(
  file: File,
  kind: "portfolio-image" | "product-image",
): Promise<string> {
  const prepared = await prepareCreatorImage(file);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CREATOR_IMAGE_TIMEOUT_MS);

  try {
    const body = new FormData();
    body.set("file", prepared);
    body.set("kind", kind);

    const response = await fetch("/api/upload/creator-image", {
      method: "POST",
      body,
      signal: controller.signal,
    });
    const result = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!response.ok || !result.url) {
      throw new Error(result.error || "Não foi possível enviar a imagem.");
    }
    return result.url;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("O envio demorou demais. Verifique sua conexão e tente novamente.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Imagens de catálogo/portfólio passam pelo servidor para validação real e
 * reconversão. Arquivos grandes de produto/entrega continuam usando upload
 * direto ao Blob para não bater no limite de payload das Functions.
 */
export async function uploadFile(
  file: File,
  kind: UploadKind,
  context: UploadContext = {},
): Promise<string> {
  if (kind === "portfolio-image" || kind === "product-image") {
    return uploadCreatorImage(file, kind);
  }

  let pathname = sanitizeFileName(file.name);
  const payload: Record<string, string> = { kind };

  if (kind === "product-file") {
    if (!context.creatorId) throw new Error("Não foi possível identificar o dono deste arquivo.");
    pathname = `creator-files/${context.creatorId}/products/${pathname}`;
    payload.creatorId = context.creatorId;
  }

  if (kind === "delivery") {
    if (!context.creatorId || !context.customServiceOrderId) {
      throw new Error("Não foi possível identificar o pedido deste arquivo.");
    }
    pathname = `creator-deliveries/${context.creatorId}/${context.customServiceOrderId}/${pathname}`;
    payload.creatorId = context.creatorId;
    payload.customServiceOrderId = context.customServiceOrderId;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      clientPayload: JSON.stringify(payload),
      abortSignal: controller.signal,
      multipart: file.size > 10 * 1024 * 1024,
    });
    return blob.url;
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error("O envio demorou demais e foi cancelado. Verifique sua conexão e tente novamente.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}


/**
 * Normaliza a foto antes de enviá-la para a rota protegida de avatar.
 * Isso reduz o tamanho do request. A validação de segurança de verdade
 * acontece novamente no servidor com inspeção dos bytes + Sharp.
 */
export async function prepareAvatarUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione uma imagem válida.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem.");

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Não foi possível preparar a imagem."))),
        "image/webp",
        0.88,
      );
    });

    if (blob.size > 4 * 1024 * 1024) {
      throw new Error("A imagem ficou grande demais para o envio.");
    }

    return new File([blob], "avatar.webp", {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}


export async function prepareCoverUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione uma imagem válida.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem.");

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Não foi possível preparar a imagem."))),
        "image/webp",
        0.88,
      );
    });

    if (blob.size > 5 * 1024 * 1024) {
      throw new Error("A imagem ficou grande demais para o envio.");
    }

    return new File([blob], "cover.webp", {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
