import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-12 w-full rounded-[1rem] border border-white/5 bg-background px-4 py-3 text-[15px] text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
