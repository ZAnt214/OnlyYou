export default function OpportunitiesLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse px-4 py-8 sm:px-6">
      <div className="h-8 w-2/3 rounded-lg bg-(--color-surface-2)" />
      <div className="mt-3 h-4 w-full max-w-xl rounded bg-(--color-surface-2)" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-64 rounded-2xl bg-(--color-surface-2)" />)}
      </div>
    </div>
  );
}
