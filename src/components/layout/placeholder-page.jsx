import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";

export function PlaceholderPage({
  title,
  description,
  icon,
  emptyTitle,
  emptyDescription,
}) {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
      />
    </div>
  );
}
