import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/supabase/session";

/**
 * Emite tokens de upload direto para o Vercel Blob (armazenamento real de
 * arquivo — substitui o storageKey "mock://media-storage/..." usado até
 * aqui em entregas de pedido e imagens de portfólio). O arquivo em si vai
 * direto do navegador para o Blob, sem passar pelo corpo desta rota — ela
 * só autoriza (usuário autenticado) e limita tipo/tamanho.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("É necessário estar autenticado para enviar arquivos.");
        }
        return {
          allowedContentTypes: [
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
            "application/pdf",
            "application/zip",
            "application/x-zip-compressed",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 200 * 1024 * 1024,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async () => {
        // Nada a persistir aqui — quem chama upload() no cliente já recebe a
        // URL final e decide onde gravar (mensagem de entrega, portfólio
        // etc.), cada uma com sua própria RPC/validação.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar o upload." },
      { status: 400 },
    );
  }
}
