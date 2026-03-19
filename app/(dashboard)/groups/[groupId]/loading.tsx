export default function GroupDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-[2rem] border border-input bg-card p-6">
        <div className="h-10 w-32 rounded-2xl bg-muted" />
        <div className="mt-6 h-8 w-56 rounded bg-muted" />
        <div className="mt-3 h-5 w-full max-w-3xl rounded bg-muted" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="animate-pulse rounded-[2rem] border border-input bg-card p-6">
            <div className="h-6 w-36 rounded bg-muted" />
            <div className="mt-4 h-24 rounded-[1.5rem] bg-muted" />
          </div>
          <div className="animate-pulse rounded-[2rem] border border-input bg-card p-6">
            <div className="h-6 w-40 rounded bg-muted" />
            <div className="mt-4 h-40 rounded-[1.5rem] bg-muted" />
          </div>
        </div>

        <div className="animate-pulse rounded-[2rem] border border-input bg-card p-6">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="mt-4 h-48 rounded-[1.5rem] bg-muted" />
          <div className="mt-4 h-48 rounded-[1.5rem] bg-muted" />
        </div>
      </div>
    </div>
  );
}
