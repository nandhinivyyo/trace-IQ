import { motion } from "framer-motion";
import { EditorContainer } from "@/components/ui/monaco-editor";
import { PlaybackProvider } from "@/services/playback-store";
import { VisualizationProvider } from "@/services/visualization-context";
import { ExplanationProvider } from "@/services/explanation-store";
import { TutorProvider } from "@/services/tutor-store.jsx";
import { DebuggerProvider } from "@/services/debugger-store.jsx";

export function CodeVisualizerPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-[calc(100vh-3.5rem)] w-full flex-col bg-[var(--color-canvas)] p-4 text-[var(--color-text-primary)] overflow-hidden"
    >
      <VisualizationProvider>
        <PlaybackProvider>
          <ExplanationProvider>
            <TutorProvider>
              <DebuggerProvider>
                <EditorContainer />
              </DebuggerProvider>
            </TutorProvider>
          </ExplanationProvider>
        </PlaybackProvider>
      </VisualizationProvider>
    </motion.div>
  );
}
