import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-micro font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text-secondary)]",
        accent:
          "bg-[var(--color-accent-subtle)] border-[var(--color-accent-subtle-border)] text-[var(--color-accent-text)]",
        outline:
          "border-[var(--color-border)] text-[var(--color-text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
