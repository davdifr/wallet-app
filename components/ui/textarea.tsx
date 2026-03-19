import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-28 w-full rounded-[1.1rem] border border-white/5 bg-secondary px-4 py-3 text-[15px] text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export { Textarea };
