import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_REQUEST_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_SIDE = 12_000;
const OUTPUT_SIDE = 1024;

function hasAllowedMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isWebp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  return isJpeg || isPng || isWebp;
}

function isManagedAvatarUrlForUser(value: string | null | undefined, userId: string): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".blob.vercel-storage.com") &&
      url.pathname.startsWith(`/avatars/${userId}/`)
    );
  } catch {
    return false;
  }
}

async function removeManagedBlob(value: string | null | undefined, userId: string) {
  if (!isManagedAvatarUrlForUser(value, userId)) return;
  try {
    await del(value);
  } catch (error) {
    // A foto já deixou de estar ligada ao perfil. Falha de limpeza não deve
    // reverter a troca, mas fica registrada para observabilidade.
    console.error("[avatar] falha ao excluir blob antigo", error instanceof Error ? error.name : "erro");
  }
}

async function processAvatar(file: File): Promise<Buffer> {
  if (file.size <= 0 || file.size > MAX_REQUEST_IMAGE_BYTES) {
    throw new Error("IMAGE_SIZE");
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (!hasAllowedMagicBytes(input)) {
    throw new Error("IMAGE_SIGNATURE");
  }

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

  // Decodifica e gera um arquivo novo. Não usamos withMetadata/keepMetadata:
  // EXIF, comentários, perfis extras e qualquer conteúdo anexado ao original
  // não são copiados para o arquivo final.
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
    .webp({
      quality: 84,
      effort: 4,
    })
    .toBuffer();
}

export async function POST(request: Request): Promise<NextResponse> {
  let newBlobUrl: string | null = null;
  let userId: string | null = null;

  try {
    const user = await getCurrentUser();
    if (!user || !user.creatorProfile) {
      return NextResponse.json({ error: "Você precisa estar logado como criador." }, { status: 403 });
    }
    userId = user.id;

    const formData = await request.formData();
    const entry = formData.get("file");
    if (!(entry instanceof File)) {
      return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 });
    }

    const processed = await processAvatar(entry);

    const blob = await put(`avatars/${user.id}/avatar.webp`, processed, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
      cacheControlMaxAge: 31536000,
    });
    newBlobUrl = blob.url;

    const supabase = await createServerClient();
    const { error: updateError } = await supabase.rpc("update_creator_avatar", {
      p_avatar_url: blob.url,
    });
    if (updateError) {
      await removeManagedBlob(blob.url, user.id);
      newBlobUrl = null;
      throw updateError;
    }

    if (user.avatar && user.avatar !== blob.url) {
      await removeManagedBlob(user.avatar, user.id);
    }

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    if (newBlobUrl && userId) {
      await removeManagedBlob(newBlobUrl, userId);
    }
    console.error("[avatar] upload recusado", error instanceof Error ? error.name : "erro");
    return NextResponse.json(
      { error: "A imagem não pôde ser validada. Use uma foto PNG, JPG ou WebP." },
      { status: 400 },
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.creatorProfile) {
      return NextResponse.json({ error: "Você precisa estar logado como criador." }, { status: 403 });
    }

    const supabase = await createServerClient();
    const { error: updateError } = await supabase.rpc("update_creator_avatar", {
      p_avatar_url: "",
    });
    if (updateError) throw updateError;

    await removeManagedBlob(user.avatar, user.id);
    return NextResponse.json({ url: "" });
  } catch (error) {
    console.error("[avatar] falha ao remover", error instanceof Error ? error.name : "erro");
    return NextResponse.json({ error: "Não foi possível remover a foto." }, { status: 400 });
  }
}
