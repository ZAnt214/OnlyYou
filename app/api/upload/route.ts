import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/supabase/session";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Cada "kind" de upload tem seu próprio limite de tipo/tamanho — sem isso,
 * a rota de entrega (que precisa aceitar zip/pdf/vídeo grande) acabaria
 * liberando os mesmos tipos e tamanho generosos para upload de imagem de
 * portfólio, que não precisa de nada disso.
 */
const KIND_RULES = {
  "portfolio-image": {
    allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    maximumSizeInBytes: 25 * 1024 * 1024,
  },
  delivery: {
    allowedContentTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "video/mp4",
      "audio/mpeg",
    ],
    maximumSizeInBytes: 200 * 1024 * 1024,
  },
  "product-image": {
    allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    maximumSizeInBytes: 25 * 1024 * 1024,
  },
  "product-file": {
    allowedContentTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "video/mp4",
      "audio/mpeg",
    ],
    maximumSizeInBytes: 500 * 1024 * 1024,
  },
} as const;

type UploadKind = keyof typeof KIND_RULES;

function parseKind(clientPayload: string | null): UploadKind | null {
  if (!clientPayload) return null;
  try {
    const { kind } = JSON.parse(clientPayload) as { kind?: string };
    return kind && kind in KIND_RULES ? (kind as UploadKind) : null;
  } catch {
    return null;
  }
}

/**
 * Emite tokens de upload direto para o Vercel Blob (armazenamento real de
 * arquivo — substitui o storageKey "mock://media-storage/..." usado até
 * aqui em entregas de pedido e imagens de portfólio). O arquivo em si vai
 * direto do navegador para o Blob, sem passar pelo corpo desta rota — ela
 * só autoriza e valida quem pode pedir cada tipo de upload:
 * - "portfolio-image": só quem tem perfil de criador.
 * - "delivery": só o criador de um pedido que ele mesmo está produzindo
 *   agora (custom_service_orders.status = "in_progress") — sem isso,
 *   qualquer conta autenticada (inclusive um comprador sem nenhum pedido)
 *   poderia usar esta rota como hospedagem de arquivo gratuita, sem
 *   relação nenhuma com uma entrega de verdade.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("É necessário estar autenticado para enviar arquivos.");
        }

        const kind = parseKind(clientPayload ?? null);
        if (!kind) {
          throw new Error("Tipo de upload inválido.");
        }

        if (kind === "portfolio-image" && !user.creatorProfile) {
          throw new Error("Só criadores podem enviar imagens de portfólio.");
        }

        if ((kind === "product-image" || kind === "product-file") && !user.creatorProfile) {
          throw new Error("Só criadores podem enviar arquivos de produto.");
        }

        if (kind === "delivery") {
          const supabase = await createServerClient();
          const { data: activeOrder } = await supabase
            .from("custom_service_orders")
            .select("id")
            .eq("creator_id", user.id)
            .eq("status", "in_progress")
            .limit(1)
            .maybeSingle();
          if (!activeOrder) {
            throw new Error("Só é possível enviar arquivo de entrega de um pedido em produção.");
          }
        }

        const rules = KIND_RULES[kind];
        return {
          allowedContentTypes: [...rules.allowedContentTypes],
          addRandomSuffix: true,
          maximumSizeInBytes: rules.maximumSizeInBytes,
          tokenPayload: JSON.stringify({ userId: user.id, kind }),
        };
      },
      onUploadCompleted: async () => {
        // Nada a persistir aqui — quem chama uploadFile() no cliente já
        // recebe a URL final e decide onde gravar (mensagem de entrega,
        // portfólio etc.), cada uma com sua própria RPC/validação.
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
