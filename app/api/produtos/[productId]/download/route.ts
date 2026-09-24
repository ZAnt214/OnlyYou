import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getSafeBlobDownloadUrl(fileUrl: string): URL | null {
  try {
    const url = new URL(fileUrl);
    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(".blob.vercel-storage.com") ||
      !url.pathname.startsWith("/creator-files/")
    ) {
      return null;
    }

    url.searchParams.set("download", "1");
    return url;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
): Promise<NextResponse> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  const { productId } = await params;
  const supabase = await createServerClient();

  // A policy de product_files só libera a linha para o criador ou para um
  // comprador com entitlement ativo. Assim o arquivo nunca é decidido pelo
  // parâmetro enviado pelo navegador.
  const { data, error } = await supabase
    .from("product_files")
    .select("file_url")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error("[product-download] falha ao consultar arquivo", error.code);
    return NextResponse.json(
      { error: "Não foi possível preparar o download." },
      { status: 500 },
    );
  }

  if (!data?.file_url) {
    return NextResponse.json(
      { error: "Arquivo não disponível para esta conta." },
      { status: 404 },
    );
  }

  const downloadUrl = getSafeBlobDownloadUrl(data.file_url);
  if (!downloadUrl) {
    console.error("[product-download] URL de arquivo inválida");
    return NextResponse.json(
      { error: "Arquivo indisponível." },
      { status: 500 },
    );
  }

  const response = NextResponse.redirect(downloadUrl, 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
