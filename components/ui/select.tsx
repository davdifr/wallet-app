import * as React from "react";

import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex min-h-12 w-full rounded-[1rem] border border-white/5 bg-background px-4 py-3 text-[15px] text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = "Select";

export { Select };
