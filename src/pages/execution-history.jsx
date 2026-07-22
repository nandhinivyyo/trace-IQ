import { History } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export function ExecutionHistoryPage() {
  return (
    <PlaceholderPage
      icon={History}
      title="Execution History"
      description="Every run you've traced, searchable and timestamped."
      emptyTitle="No runs recorded yet"
      emptyDescription="Once you trace a program, it will show up here with its inputs, output, and duration."
    />
  );
}
