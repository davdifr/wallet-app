export default function RecurringIncomesLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
      <div className="animate-pulse rounded-3xl border border-input bg-card p-6">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="mt-4 h-10 w-full rounded-2xl bg-muted" />
        <div className="mt-3 h-10 w-full rounded-2xl bg-muted" />
        <div className="mt-3 h-28 w-full rounded-2xl bg-muted" />
      </div>
      <div className="animate-pulse rounded-3xl border border-input bg-card p-6">
        <div className="h-5 w-44 rounded bg-muted" />
        <div className="mt-4 h-24 w-full rounded-2xl bg-muted" />
        <div className="mt-3 h-24 w-full rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
