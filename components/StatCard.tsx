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
    <div className="flex flex-col gap-1 rounded-lg border border-(--color-border) bg-(--color-bg) p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-(--color-text-muted)">{label}</span>
        {Icon ? <Icon size={16} className="text-(--color-text-subtle)" strokeWidth={1.5} /> : null}
      </div>
      <span className="text-2xl font-semibold text-(--color-text)">{value}</span>
      {hint ? <span className="text-xs text-(--color-text-subtle)">{hint}</span> : null}
    </div>
  );
}
