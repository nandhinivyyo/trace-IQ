import { Settings as SettingsIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export function SettingsPage() {
  return (
    <PlaceholderPage
      icon={SettingsIcon}
      title="Settings"
      description="Manage your preferences, editor, and integrations."
      emptyTitle="Settings are on the way"
      emptyDescription="Editor behavior, notifications, and connected accounts will be configurable here."
    />
  );
}
