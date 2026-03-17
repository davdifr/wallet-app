import { AlertCircle } from "lucide-react";

type NoticeCardProps = {
  title: string;
  message: string;
};

export function NoticeCard({ title, message }: NoticeCardProps) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-amber-800">{message}</p>
        </div>
      </div>
    </div>
  );
}
