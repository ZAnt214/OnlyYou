// TODO(integração):
// Implementar armazenamento privado de mídia com URLs assinadas/temporárias,
// streaming protegido e revogação de acesso. O que existe hoje é apenas
// metadado simulado — nenhum arquivo real é armazenado, transformado ou
// servido por este módulo.
// TODO(integração): avaliar marca d'água (watermarking) dinâmica por comprador.
// TODO(integração): implementar revogação de acesso a mídia já entregue
// (ex.: em caso de reembolso, chargeback ou remoção de produto).
//
// Este módulo trata apenas de "proteção de mídia e controle de acesso" —
// não há qualquer implementação de DRM real nesta fase.

export interface MediaUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface MediaAsset {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface MediaStorageProvider {
  upload(input: MediaUploadInput): Promise<MediaAsset>;
  getSignedUrl(assetId: string): Promise<string>;
  revokeAccess(assetId: string, userId: string): Promise<void>;
}

/**
 * Implementação simulada: nenhum byte real é armazenado. Apenas metadados
 * são guardados em memória para permitir que o fluxo de "publicar produto"
 * funcione de ponta a ponta nesta fase de mock.
 */
export class MockMediaStorageProvider implements MediaStorageProvider {
  private assets = new Map<string, MediaAsset>();

  async upload(input: MediaUploadInput): Promise<MediaAsset> {
    const asset: MediaAsset = {
      id: `media-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedAt: new Date().toISOString(),
    };
    this.assets.set(asset.id, asset);
    return asset;
  }

  async getSignedUrl(assetId: string): Promise<string> {
    // Em um provedor real, retornaria uma URL temporária assinada apontando
    // para armazenamento privado (protegido por proteção de mídia e
    // controle de acesso).
    return `mock://media-storage/${assetId}`;
  }

  async revokeAccess(assetId: string, userId: string): Promise<void> {
    void assetId;
    void userId;
    // Em um provedor real, isso invalidaria URLs assinadas emitidas e
    // registraria a revogação para auditoria.
  }
}

export const mockMediaStorageProvider = new MockMediaStorageProvider();
