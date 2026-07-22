import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

const PlaybackContext = createContext(undefined);

const LOCAL_STORAGE_KEY = "codeinsight-replay-sessions";

export function PlaybackProvider({ children }) {
  const [traces, setTraces] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.5);
  const timerRef = useRef(null);

  // States
  const [bookmarks, setBookmarks] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [compareStepA, setCompareStepA] = useState(null);
  const [compareStepB, setCompareStepB] = useState(null);
  const [complexity, setComplexity] = useState(null);

  // Session management state
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Shared console logs
  const [consoleLogs, setConsoleLogs] = useState([]);

  // Load saved sessions on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setSessions(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load sessions from localStorage", e);
    }
  }, []);

  // Save sessions helper
  const updateSessions = (newSessions) => {
    setSessions(newSessions);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSessions));
    } catch (e) {
      console.error("Failed to write sessions to localStorage", e);
    }
  };

  const nextStep = useCallback(() => {
    setCurrentStepIdx((prev) => {
      if (prev < traces.length - 1) return prev + 1;
      setIsPlaying(false);
      return prev;
    });
  }, [traces.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIdx((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const skipForward = useCallback(
    (steps = 5) => {
      setCurrentStepIdx((prev) => Math.min(traces.length - 1, prev + steps));
    },
    [traces.length],
  );

  const skipBackward = useCallback((steps = 5) => {
    setCurrentStepIdx((prev) => Math.max(0, prev - steps));
  }, []);

  const jumpToStep = useCallback(
    (idx) => {
      if (idx >= 0 && idx < traces.length) {
        setCurrentStepIdx(idx);
      }
    },
    [traces.length],
  );

  // Jump to next execution step on a specific source line number
  const jumpToLine = useCallback(
    (lineNum) => {
      const idx = traces.findIndex(
        (step, i) => i > currentStepIdx && step.currentLineNumber === lineNum,
      );
      if (idx !== -1) {
        setCurrentStepIdx(idx);
      } else {
        // search from beginning
        const firstIdx = traces.findIndex(
          (step) => step.currentLineNumber === lineNum,
        );
        if (firstIdx !== -1) {
          setCurrentStepIdx(firstIdx);
        }
      }
    },
    [traces, currentStepIdx],
  );

  // Jump to execution step where function frame is pushed or matching function name
  const jumpToFunction = useCallback(
    (fnName) => {
      const idx = traces.findIndex(
        (step, i) => i > currentStepIdx && step.currentFunction === fnName,
      );
      if (idx !== -1) {
        setCurrentStepIdx(idx);
      } else {
        const firstIdx = traces.findIndex(
          (step) => step.currentFunction === fnName,
        );
        if (firstIdx !== -1) {
          setCurrentStepIdx(firstIdx);
        }
      }
    },
    [traces, currentStepIdx],
  );

  // Jump to loop iteration change
  const jumpToLoop = useCallback(
    (iteration) => {
      const idx = traces.findIndex((step, i) => {
        if (i <= currentStepIdx || !step.loopInformation) return false;
        if (iteration !== undefined) {
          return step.loopInformation.iterationNumber === iteration;
        }
        // Or just jump to next loop boundary
        return true;
      });
      if (idx !== -1) {
        setCurrentStepIdx(idx);
      }
    },
    [traces, currentStepIdx],
  );

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const restart = useCallback(() => {
    setCurrentStepIdx(traces.length > 0 ? 0 : -1);
    setIsPlaying(false);
  }, [traces.length]);

  const clearTraces = useCallback(() => {
    setTraces([]);
    setCurrentStepIdx(-1);
    setIsPlaying(false);
    setBookmarks([]);
    setSnapshots([]);
    setCompareStepA(null);
    setCompareStepB(null);
    setActiveSessionId(null);
    setConsoleLogs([]);
    setComplexity(null);
  }, []);

  // Bookmarks
  const toggleBookmark = useCallback(
    (idx, category = "step", label) => {
      if (idx < 0 || idx >= traces.length) return;
      const currentStep = traces[idx];
      setBookmarks((prev) => {
        const exists = prev.find((b) => b.stepIdx === idx);
        if (exists) {
          return prev.filter((b) => b.stepIdx !== idx);
        } else {
          const item = {
            id: Math.random().toString(36).substring(2, 9),
            stepIdx: idx,
            label: label || `Step ${idx + 1} (${currentStep.currentFunction})`,
            category,
            timestamp: new Date().toLocaleTimeString(),
          };
          return [...prev, item].sort((a, b) => a.stepIdx - b.stepIdx);
        }
      });
    },
    [traces],
  );

  const deleteBookmark = useCallback((id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const isBookmarked = useCallback(
    (idx) => {
      return bookmarks.some((b) => b.stepIdx === idx);
    },
    [bookmarks],
  );

  // Snapshots
  const saveSnapshot = useCallback(
    (name) => {
      if (currentStepIdx === -1) return;
      const currentStep = traces[currentStepIdx];
      // Attempt parsing console output
      const consoleLogs = currentStep.currentConsoleOutput
        ? [currentStep.currentConsoleOutput]
        : [];

      const newSnapshot = {
        id: Math.random().toString(36).substring(2, 9),
        name: name || `Snapshot Step ${currentStepIdx + 1}`,
        stepIdx: currentStepIdx,
        timestamp: new Date().toLocaleTimeString(),
        variablesSnapshot: JSON.parse(
          JSON.stringify(currentStep.variablesAfter || []),
        ),
        stackSnapshot: JSON.parse(
          JSON.stringify(currentStep.functionStack || []),
        ),
        consoleSnapshot: consoleLogs,
      };
      setSnapshots((prev) => [...prev, newSnapshot]);
    },
    [currentStepIdx, traces],
  );

  const restoreSnapshot = useCallback(
    (id) => {
      const snap = snapshots.find((s) => s.id === id);
      if (snap) {
        jumpToStep(snap.stepIdx);
      }
    },
    [snapshots, jumpToStep],
  );

  const deleteSnapshot = useCallback((id) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Save current active trace state into a session
  const saveCurrentSession = useCallback(
    (name) => {
      if (traces.length === 0) return;
      const lang = localStorage.getItem("codeinsight-lang") || "python";
      const lastSessionName =
        name ||
        `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      // Dispatch custom request event to fetch text content of active editor
      const editorQueryEvent = new CustomEvent(
        "request-editor-content-for-session",
        {
          detail: {
            callback: (codeText) => {
              const newSession = {
                id: Math.random().toString(36).substring(2, 9),
                name: lastSessionName,
                timestamp: new Date().toLocaleString(),
                code: codeText,
                language: lang,
                traces,
                bookmarks,
                snapshots,
                lastViewedStep: currentStepIdx,
                playbackSpeed,
              };
              setSessions((prev) => {
                const index = prev.findIndex((s) => s.id === activeSessionId);
                let updated;
                if (index !== -1 && activeSessionId) {
                  const copy = [...prev];
                  copy[index] = { ...newSession, id: activeSessionId };
                  updated = copy;
                } else {
                  updated = [...prev, newSession];
                }
                localStorage.setItem(
                  LOCAL_STORAGE_KEY,
                  JSON.stringify(updated),
                );
                return updated;
              });
            },
          },
        },
      );
      window.dispatchEvent(editorQueryEvent);
    },
    [
      traces,
      bookmarks,
      snapshots,
      currentStepIdx,
      playbackSpeed,
      activeSessionId,
    ],
  );

  const loadSession = useCallback(
    (sessionId) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      setActiveSessionId(session.id);
      setTraces(session.traces);
      setBookmarks(session.bookmarks);
      setSnapshots(session.snapshots);
      setPlaybackSpeed(session.playbackSpeed);
      setTimeout(() => {
        setCurrentStepIdx(session.lastViewedStep);
      }, 50);

      localStorage.setItem("codeinsight-lang", session.language);
      window.dispatchEvent(
        new CustomEvent("editor-upload-file", { detail: session.code }),
      );
      window.dispatchEvent(
        new CustomEvent("editor-change-lang", { detail: session.language }),
      );
    },
    [sessions],
  );

  const deleteSession = useCallback(
    (sessionId) => {
      const updated = sessions.filter((s) => s.id !== sessionId);
      updateSessions(updated);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
    },
    [sessions, activeSessionId],
  );

  // Playback timer loop
  useEffect(() => {
    if (isPlaying && traces.length > 0) {
      const interval = 1000 / playbackSpeed;
      timerRef.current = setInterval(() => {
        nextStep();
      }, interval);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, traces, nextStep]);

  // Keyboard Shortcuts Bindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.classList.contains("inputarea")
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.ctrlKey) {
            skipBackward(5);
          } else {
            prevStep();
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.ctrlKey) {
            skipForward(5);
          } else {
            nextStep();
          }
          break;
        case "Home":
          e.preventDefault();
          jumpToStep(0);
          break;
        case "End":
          e.preventDefault();
          if (traces.length > 0) {
            jumpToStep(traces.length - 1);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    prevStep,
    nextStep,
    skipForward,
    skipBackward,
    jumpToStep,
    traces.length,
  ]);

  return (
    <PlaybackContext.Provider
      value={{
        traces,
        setTraces,
        currentStepIdx,
        setCurrentStepIdx,
        isPlaying,
        playbackSpeed,
        nextStep,
        prevStep,
        skipForward,
        skipBackward,
        jumpToStep,
        jumpToLine,
        jumpToFunction,
        jumpToLoop,
        togglePlay,
        setPlaybackSpeed,
        restart,
        clearTraces,
        bookmarks,
        toggleBookmark,
        deleteBookmark,
        isBookmarked,
        snapshots,
        saveSnapshot,
        restoreSnapshot,
        deleteSnapshot,
        compareStepA,
        setCompareStepA,
        compareStepB,
        setCompareStepB,

        sessions,
        saveCurrentSession,
        loadSession,
        deleteSession,
        activeSessionId,

        consoleLogs,
        setConsoleLogs,

        complexity,
        setComplexity,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return context;
}
