export default function GroupsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-3xl border border-input bg-card p-6">
        <div className="h-5 w-28 rounded bg-muted" />
        <div className="mt-4 h-10 w-64 rounded bg-muted" />
        <div className="mt-3 h-5 w-full max-w-2xl rounded bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[2rem] border border-input bg-card p-5"
          >
            <div className="h-6 w-36 rounded bg-muted" />
            <div className="mt-3 h-4 w-full rounded bg-muted" />
            <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="h-12 rounded-2xl bg-muted" />
              <div className="h-12 rounded-2xl bg-muted" />
              <div className="h-12 rounded-2xl bg-muted" />
              <div className="h-12 rounded-2xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
