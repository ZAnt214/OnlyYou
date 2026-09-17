import type { LucideIcon } from "lucide-react";

/** Estado vazio padrão: ícone em círculo, título forte e texto de apoio. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-surface-2) text-(--color-text-muted)">
        <Icon size={32} strokeWidth={1.5} />
      </span>
      <h2 className="text-lg font-bold text-(--color-text)">{title}</h2>
      <p className="max-w-xs text-sm text-(--color-text-muted)">{description}</p>
      {action}
    </div>
  );
}
