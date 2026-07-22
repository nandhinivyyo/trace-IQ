import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] text-body-sm font-medium transition-colors duration-[var(--duration-fast)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[15px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent)] text-[#052312] hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-active)]",
        secondary:
          "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-overlay)] hover:border-[var(--color-border-strong)]",
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]",
        outline:
          "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]",
        danger:
          "bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/15",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2.5 text-caption",
        lg: "h-9 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
