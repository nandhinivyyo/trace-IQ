import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function EmptyState({
  icon: Icon,
  title,
  description,
  status = "In development",
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full max-w-md flex-col items-center gap-4 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <Icon
            className="h-5 w-5 text-[var(--color-accent-text)]"
            strokeWidth={1.75}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-title-sm text-[var(--color-text-primary)]">
            {title}
          </h2>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        </div>
        <Badge variant="accent">{status}</Badge>
      </motion.div>
    </div>
  );
}
