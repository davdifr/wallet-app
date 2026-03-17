function LoadingCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-4 h-10 w-full rounded-2xl bg-slate-200" />
      <div className="mt-3 h-10 w-full rounded-2xl bg-slate-200" />
      <div className="mt-3 h-10 w-2/3 rounded-2xl bg-slate-200" />
    </div>
  );
}

export default function TransactionsLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
      <LoadingCard />
      <LoadingCard />
    </div>
  );
}
