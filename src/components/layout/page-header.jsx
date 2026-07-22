export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-border-subtle)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-heading text-[var(--color-text-primary)]">
          {title}
        </h1>
        <p className="text-body-sm text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
