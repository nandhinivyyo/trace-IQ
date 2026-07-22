import { Workflow } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export function DsaVisualizerPage() {
  return (
    <PlaceholderPage
      icon={Workflow}
      title="DSA Visualizer"
      description="Watch data structures and algorithms run, frame by frame."
      emptyTitle="Pick a structure to visualize"
      emptyDescription="Arrays, trees, graphs, and common algorithms will animate here as they run."
    />
  );
}
