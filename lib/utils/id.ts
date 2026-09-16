/**
 * Gerador de id simples para fixtures/mutações mock. Isolado num módulo
 * utilitário (fora de componentes React) para não disparar o lint de
 * "impure function during render" quando chamado a partir de um efeito.
 */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
