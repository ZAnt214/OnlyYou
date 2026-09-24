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

interface UploadPayload {
  kind: UploadKind;
  creatorId?: string;
  customServiceOrderId?: string;
}

function parsePayload(clientPayload: string | null): UploadPayload | null {
  if (!clientPayload) return null;
  try {
    const value = JSON.parse(clientPayload) as {
      kind?: string;
      creatorId?: string;
      customServiceOrderId?: string;
    };
    if (!value.kind || !(value.kind in KIND_RULES)) return null;
    return {
      kind: value.kind as UploadKind,
      creatorId: value.creatorId,
      customServiceOrderId: value.customServiceOrderId,
    };
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
 * Imagens públicas de criador usam /api/upload/creator-image, onde são
 * decodificadas e reprocessadas no servidor antes de chegar ao Blob.
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
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("É necessário estar autenticado para enviar arquivos.");
        }

        const payload = parsePayload(clientPayload ?? null);
        if (!payload) {
          throw new Error("Tipo de upload inválido.");
        }

        const { kind } = payload;

        if (kind === "product-file") {
          if (!user.creatorProfile || payload.creatorId !== user.id) {
            throw new Error("Só o próprio criador pode enviar este arquivo.");
          }
          const prefix = `creator-files/${user.id}/products/`;
          if (!pathname.startsWith(prefix)) {
            throw new Error("Destino de arquivo inválido.");
          }
        }

        if (kind === "delivery") {
          if (
            payload.creatorId !== user.id ||
            !payload.customServiceOrderId ||
            !pathname.startsWith(
              `creator-deliveries/${user.id}/${payload.customServiceOrderId}/`,
            )
          ) {
            throw new Error("Destino de entrega inválido.");
          }

          const supabase = await createServerClient();
          const { data: activeOrder } = await supabase
            .from("custom_service_orders")
            .select("id")
            .eq("id", payload.customServiceOrderId)
            .eq("creator_id", user.id)
            .eq("status", "in_progress")
            .maybeSingle();
          if (!activeOrder) {
            throw new Error("Este pedido não está disponível para envio de arquivos.");
          }
        }

        const rules = KIND_RULES[kind];
        return {
          allowedContentTypes: [...rules.allowedContentTypes],
          addRandomSuffix: true,
          maximumSizeInBytes: rules.maximumSizeInBytes,
          tokenPayload: JSON.stringify({ userId: user.id, ...payload }),
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
    console.error("[upload] falha ao autorizar upload", error instanceof Error ? error.name : "erro");
    return NextResponse.json(
      { error: "Não foi possível autorizar o envio deste arquivo." },
      { status: 400 },
    );
  }
}
