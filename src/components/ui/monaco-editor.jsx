import { lazy, Suspense } from "react";

// Lazy load the heavy Monaco Editor implementation
const MonacoEditorImpl = lazy(() => import("./monaco-editor-impl"));

// Re-export subcomponents statically (they are lightweight UI)
export {
  EditorToolbar,
  LanguageSelector,
  ThemeSelector,
  EditorStatusBar,
} from "./monaco-editor-subcomponents";

// Main wrapped container
export function EditorContainer() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-[#0B0B0B] border border-[#232323] rounded-[var(--radius-md)] text-[var(--color-text-secondary)] font-mono text-caption">
          <div className="flex flex-col items-center gap-2.5">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            <span className="animate-pulse">
              Initializing editor components...
            </span>
          </div>
        </div>
      }
    >
      <MonacoEditorImpl />
    </Suspense>
  );
}
