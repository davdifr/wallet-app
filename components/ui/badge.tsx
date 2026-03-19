import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
  {
    variants: {
      variant: {
        default: "border-white/8 bg-white/[0.04] text-slate-300",
        secondary: "border-white/8 bg-white/[0.04] text-slate-300",
        outline: "border-white/8 bg-transparent text-slate-400"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
