import { FolderCode } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export function SavedProgramsPage() {
  return (
    <PlaceholderPage
      icon={FolderCode}
      title="Saved Programs"
      description="Programs you've bookmarked for later review."
      emptyTitle="Nothing saved yet"
      emptyDescription="Bookmark a program from the visualizer to keep it within reach here."
    />
  );
}
