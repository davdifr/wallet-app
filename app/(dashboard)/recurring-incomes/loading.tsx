export default function RecurringIncomesLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-full rounded-2xl bg-slate-200" />
        <div className="mt-3 h-10 w-full rounded-2xl bg-slate-200" />
        <div className="mt-3 h-28 w-full rounded-2xl bg-slate-200" />
      </div>
      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
        <div className="h-5 w-44 rounded bg-slate-200" />
        <div className="mt-4 h-24 w-full rounded-2xl bg-slate-200" />
        <div className="mt-3 h-24 w-full rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
