import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldAlert } from "lucide-react";
import { EditorContainer } from "@/components/ui/monaco-editor";
import { PlaybackProvider } from "@/services/playback-store";
import { VisualizationProvider } from "@/services/visualization-context";
import { ExplanationProvider } from "@/services/explanation-store";
import { TutorProvider } from "@/services/tutor-store.jsx";
import { DebuggerProvider } from "@/services/debugger-store.jsx";

export function CodeVisualizerPage() {
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanPass = passcode.replace(/\s+/g, ""); // Allow spaces: "1 2 3" or "123"
    if (cleanPass === "123") {
      setIsUnlocked(true);
      setError("");
    } else {
      setError("Incorrect passcode. Access Denied.");
      setPasscode("");
    }
  };

  if (isUnlocked) {
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

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full items-center justify-center bg-[var(--color-canvas)] text-[var(--color-text-primary)] p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl backdrop-blur-md bg-opacity-70 text-center relative overflow-hidden"
      >
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="mx-auto h-16 w-16 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] shadow-[0_0_20px_rgba(34,197,94,0.15)] mb-6">
          <Lock className="h-7 w-7" />
        </div>

        <h2 className="text-title-sm font-extrabold text-[var(--color-text-primary)] tracking-tight mb-2">
          Passcode Required
        </h2>
        <p className="text-caption text-zinc-500 max-w-xs mx-auto mb-6">
          The Code Visualizer workspace is locked. Enter the authorization passcode to access.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-center font-mono text-[16px] tracking-[0.3em] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-zinc-600 placeholder:font-sans placeholder:tracking-normal placeholder:text-[13px]"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 font-semibold text-micro bg-red-500/10 border border-red-500/20 py-2.5 rounded-lg">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-black font-bold rounded-xl text-body-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            Unlock Workspace
          </button>
        </form>
      </motion.div>
    </div>
  );
}
