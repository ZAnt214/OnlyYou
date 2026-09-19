import { upload } from "@vercel/blob/client";

/**
 * Upload real de arquivo (Vercel Blob) direto do navegador — a rota
 * /api/upload só autoriza e limita tipo/tamanho, o arquivo em si nunca
 * passa pelo nosso servidor. Devolve a URL pública definitiva do arquivo.
 */
export async function uploadFile(file: File): Promise<string> {
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });
  return blob.url;
}
