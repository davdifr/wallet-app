import { AlertCircle } from "lucide-react";

type NoticeCardProps = {
  title: string;
  message: string;
};

export function NoticeCard({ title, message }: NoticeCardProps) {
  return (
    <div className="rounded-[1.25rem] border border-white/6 bg-card p-4 text-foreground shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-secondary text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[15px] font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
