import { Sparkles } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export function AiHintTutorPage() {
  return (
    <PlaceholderPage
      icon={Sparkles}
      title="AI Hint Tutor"
      description="Ask for a nudge in the right direction, not the answer."
      emptyTitle="Ready when you are"
      emptyDescription="Bring a problem you're stuck on and the tutor will guide you toward the solution."
    />
  );
}
