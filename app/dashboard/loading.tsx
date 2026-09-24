import { DashboardLoading } from "@/components/DashboardLoading";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-(--color-surface-2)" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-(--color-surface-2)" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-(--color-surface-2)" />
        <div className="h-24 animate-pulse rounded-2xl bg-(--color-surface-2)" />
        <div className="col-span-2 h-24 animate-pulse rounded-2xl bg-(--color-surface-2) sm:col-span-1" />
      </div>
      <DashboardLoading />
    </div>
  );
}
