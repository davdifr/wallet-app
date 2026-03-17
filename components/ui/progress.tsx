import { cn } from "@/lib/utils";

type ProgressProps = {
  className?: string;
  value: number;
};

export function Progress({ className, value }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <div
        className="h-full rounded-full bg-slate-950 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
