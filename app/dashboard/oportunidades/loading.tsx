export default function CreatorOpportunitiesLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl animate-pulse">
      <div className="h-48 rounded-2xl bg-(--color-surface-2)" />
      <div className="mt-6 flex flex-col gap-4">
        {[0, 1, 2].map((item) => <div key={item} className="h-64 rounded-2xl bg-(--color-surface-2)" />)}
      </div>
    </div>
  );
}
