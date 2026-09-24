import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/supabase/session";

export const runtime = "nodejs";

const MAX_INPUT_BYTES = 3.5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 50_000_000;
const MAX_SIDE = 12_000;
const OUTPUT_SIDE = 1920;

type ImageKind = "portfolio-image" | "product-image";

function parseKind(value: FormDataEntryValue | null): ImageKind | null {
  return value === "portfolio-image" || value === "product-image" ? value : null;
}

function hasAllowedMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const webp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return jpeg || png || webp;
}

async function normalizeImage(file: File): Promise<Buffer> {
  if (file.size <= 0 || file.size > MAX_INPUT_BYTES) throw new Error("IMAGE_SIZE");

  const input = Buffer.from(await file.arrayBuffer());
  if (!hasAllowedMagicBytes(input)) throw new Error("IMAGE_SIGNATURE");

  const image = sharp(input, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
    sequentialRead: true,
  });
  const metadata = await image.metadata();

  if (
    !metadata.format ||
    !["jpeg", "png", "webp"].includes(metadata.format) ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > MAX_SIDE ||
    metadata.height > MAX_SIDE
  ) {
    throw new Error("IMAGE_FORMAT");
  }

  // Recria o arquivo em vez de guardar o original. Isso remove EXIF,
  // comentários e bytes extras e impede MIME falso de chegar ao Blob.
  return sharp(input, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
    sequentialRead: true,
  })
    .rotate()
    .resize({
      width: OUTPUT_SIDE,
      height: OUTPUT_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user?.creatorProfile) {
      return NextResponse.json({ error: "Você precisa estar logado como criador." }, { status: 403 });
    }

    const form = await request.formData();
    const kind = parseKind(form.get("kind"));
    const file = form.get("file");
    if (!kind || !(file instanceof File)) {
      return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
    }

    const processed = await normalizeImage(file);
    const folder = kind === "product-image" ? "products" : "portfolio";
    const blob = await put(`creator-images/${user.id}/${folder}/image.webp`, processed, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
      cacheControlMaxAge: 31536000,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[creator-image] upload recusado", error instanceof Error ? error.name : "erro");
    return NextResponse.json(
      { error: "A imagem não pôde ser validada. Use PNG, JPG ou WebP." },
      { status: 400 },
    );
  }
}
