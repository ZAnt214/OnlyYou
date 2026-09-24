import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-(--color-text-muted)">{label}</span>
        {Icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-(--color-surface-2)">
            <Icon size={15} className="text-(--color-accent-text)" strokeWidth={1.7} />
          </span>
        ) : null}
      </div>
      <span className="truncate text-2xl font-bold tracking-tight text-(--color-text)">{value}</span>
      {hint ? <span className="text-xs leading-relaxed text-(--color-text-subtle)">{hint}</span> : null}
    </div>
  );
}
