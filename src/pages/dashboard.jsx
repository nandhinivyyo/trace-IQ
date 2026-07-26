import { LayoutDashboard } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export function DashboardPage() {
  return (
    <PlaceholderPage
      icon={LayoutDashboard}
      title="Dashboard"
      description="An overview of your activity across TraceIQ AI."
      emptyTitle="Your dashboard is being wired up"
      emptyDescription="Recent runs, saved programs, and hint activity will surface here once you start tracing code."
    />
  );
}
