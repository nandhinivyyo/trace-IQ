import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard";
import { CodeVisualizerPage } from "@/pages/code-visualizer";
import { DsaTutorPage } from "@/pages/dsa-tutor";
import { ExecutionHistoryPage } from "@/pages/execution-history";
import { SavedProgramsPage } from "@/pages/saved-programs";
import { AiHintTutorPage } from "@/pages/ai-hint-tutor";
import { SettingsPage } from "@/pages/settings";
import { ProfilePage } from "@/pages/profile";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/code-visualizer" element={<CodeVisualizerPage />} />
        <Route path="/dsa-tutor" element={<DsaTutorPage />} />
        <Route path="/history" element={<ExecutionHistoryPage />} />
        <Route path="/saved" element={<SavedProgramsPage />} />
        <Route path="/hint-tutor" element={<AiHintTutorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
