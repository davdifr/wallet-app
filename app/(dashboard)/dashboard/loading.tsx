function LoadingBlock({
  className
}: Readonly<{
  className?: string;
}>) {
  return <div className={`animate-pulse rounded-3xl bg-slate-200/80 ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-5 pb-12 sm:space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-6 shadow-soft sm:p-8">
        <LoadingBlock className="h-5 w-44 bg-white/10" />
        <LoadingBlock className="mt-4 h-9 w-40 rounded-full bg-white/10" />
        <LoadingBlock className="mt-8 h-8 w-40 bg-white/10" />
        <LoadingBlock className="mt-4 h-14 w-52 bg-white/10" />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <LoadingBlock className="h-24 rounded-[1.75rem] bg-white/10" />
          <LoadingBlock className="h-24 rounded-[1.75rem] bg-white/10" />
          <LoadingBlock className="h-24 rounded-[1.75rem] bg-white/10" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="mt-4 h-32 rounded-[1.75rem] bg-slate-200" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-[1.5rem] bg-slate-200" />
            <div className="h-24 rounded-[1.5rem] bg-slate-200" />
            <div className="h-24 rounded-[1.5rem] bg-slate-200" />
          </div>
        </div>
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-4 h-8 rounded-2xl bg-slate-200" />
          <div className="mt-3 h-8 rounded-2xl bg-slate-200" />
          <div className="mt-3 h-8 rounded-2xl bg-slate-200" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-4 h-28 rounded-[1.75rem] bg-slate-200" />
        </div>
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="mt-4 h-16 rounded-[1.5rem] bg-slate-200" />
          <div className="mt-3 h-16 rounded-[1.5rem] bg-slate-200" />
        </div>
      </section>
    </div>
  );
}
