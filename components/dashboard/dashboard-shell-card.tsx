import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardShellCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardShellCard({
  title,
  subtitle,
  action,
  children,
  className,
  contentClassName
}: DashboardShellCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-white/6 bg-[#121927] text-white shadow-[0_14px_34px_rgba(0,0,0,0.2)]",
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="font-display text-[1.2rem] tracking-tight text-white">
            {title}
          </CardTitle>
          {subtitle ? <p className="text-sm leading-6 text-slate-400">{subtitle}</p> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
