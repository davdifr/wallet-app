import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[1rem] text-[15px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-card hover:bg-[hsl(var(--primary)/0.94)]",
        outline:
          "border border-white/6 bg-secondary text-foreground hover:bg-[hsl(var(--secondary)/0.9)]",
        ghost: "bg-transparent text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
      },
      size: {
        default: "px-5 py-3",
        sm: "min-h-11 px-4 py-2.5 text-sm",
        lg: "min-h-12 px-6 py-3.5 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
