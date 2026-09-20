export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-8 px-4 py-7" aria-label="Carregando página Explorar">
      <section className="space-y-4 py-5">
        <div className="h-1 w-10 rounded-full bg-(--color-accent-soft)" />
        <div className="h-9 w-11/12 rounded-lg bg-(--color-surface-2)" />
        <div className="h-4 w-4/5 rounded-full bg-(--color-surface-2)" />
        <div className="h-12 w-full rounded-(--radius-pill) bg-(--color-surface-2)" />
      </section>
      <div className="space-y-3">
        <div className="h-4 w-36 rounded-full bg-(--color-surface-2)" />
        <div className="flex gap-5">
          <div className="h-8 w-16 rounded-lg bg-(--color-surface-2)" />
          <div className="h-8 w-24 rounded-lg bg-(--color-surface-2)" />
          <div className="h-8 w-28 rounded-lg bg-(--color-surface-2)" />
        </div>
      </div>
      <div className="border-t border-(--color-border) pt-5">
        <div className="mb-4 h-6 w-48 rounded-lg bg-(--color-surface-2)" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-52 rounded-2xl bg-(--color-surface-2)" />
          <div className="h-52 rounded-2xl bg-(--color-surface-2)" />
        </div>
      </div>
    </div>
  );
}
