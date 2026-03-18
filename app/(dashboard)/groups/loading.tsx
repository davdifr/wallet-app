export default function GroupsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
        <div className="h-5 w-28 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-64 rounded bg-slate-200" />
        <div className="mt-3 h-5 w-full max-w-2xl rounded bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-soft"
          >
            <div className="h-6 w-36 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-full rounded bg-slate-200" />
            <div className="mt-2 h-4 w-3/4 rounded bg-slate-200" />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="h-12 rounded-2xl bg-slate-200" />
              <div className="h-12 rounded-2xl bg-slate-200" />
              <div className="h-12 rounded-2xl bg-slate-200" />
              <div className="h-12 rounded-2xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
