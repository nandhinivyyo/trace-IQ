import { UserRound } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export function ProfilePage() {
  return (
    <PlaceholderPage
      icon={UserRound}
      title="Profile"
      description="Your account, plan, and personal details."
      emptyTitle="Profile details coming soon"
      emptyDescription="Your name, avatar, plan, and usage stats will live on this page."
    />
  );
}
