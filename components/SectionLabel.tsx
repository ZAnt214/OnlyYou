/**
 * Rótulo de contexto curto acima do título de uma seção.
 * Mantém o texto leve e usa somente o ponto laranja da marca como marcador,
 * sem fundo, borda ou aparência de botão/chip.
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
      className={`inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-text-muted) ${className}`}
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-(--color-accent)"
      />
      {children}
    </span>
  );
}
