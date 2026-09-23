/**
 * Etiqueta de contexto curta acima do título de uma seção — mesmo padrão
 * visual do chip ativo (bg-(--color-accent-soft) + text-(--color-accent-text))
 * já usado em filtros e badges, pra ter um único componente de "section
 * label" reaproveitado em toda a home em vez de texto solto em caixa alta
 * que passava despercebido.
 */
export function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block w-fit rounded-full bg-(--color-accent-soft) px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-accent-text) ${className}`}
    >
      {children}
    </span>
  );
}
