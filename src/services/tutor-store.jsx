import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const TutorContext = createContext(undefined);

const LOCAL_STORAGE_KEY_HINTS = "codeinsight-tutor-unlocked-level";
const LOCAL_STORAGE_KEY_MODE = "codeinsight-tutor-mode";
const LOCAL_STORAGE_KEY_PROVIDER = "codeinsight-tutor-provider";

export function TutorProvider({ children }) {
  const [tutorMode, setTutorMode] = useState(() => 
    localStorage.getItem(LOCAL_STORAGE_KEY_MODE) || "hint"
  );
  
  const [tutorProvider, setTutorProvider] = useState(() => 
    localStorage.getItem(LOCAL_STORAGE_KEY_PROVIDER) || "mock"
  );

  const [unlockedHintLevel, setUnlockedHintLevel] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_HINTS);
    return saved ? parseInt(saved, 10) : 1;
  });

  const [tutorResponse, setTutorResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_MODE, tutorMode);
  }, [tutorMode]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PROVIDER, tutorProvider);
  }, [tutorProvider]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_HINTS, unlockedHintLevel.toString());
  }, [unlockedHintLevel]);

  // Consult the AI Tutor endpoint
  const consultTutorApi = useCallback(async (problemName, currentCode, levelOverride = null) => {
    setIsLoading(true);
    setError(null);

    const level = levelOverride !== null ? levelOverride : unlockedHintLevel;
    const activeLang = localStorage.getItem("codeinsight-lang") || "python";

    try {
      const response = await fetch("http://localhost:8080/api/tutor/consult", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code: currentCode,
          language: activeLang,
          problemName: problemName || "binary search",
          mode: tutorMode.toUpperCase(),
          activeLevel: level,
          provider: tutorProvider.toUpperCase()
        })
      });

      if (!response.ok) {
        throw new Error(`AI Tutor server error: ${response.statusText}`);
      }

      const result = await response.json();
      setTutorResponse(result);
    } catch (err) {
      console.error("AI Tutor consult request failed", err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, [tutorMode, tutorProvider, unlockedHintLevel]);

  // Progressive hints locks management
  const unlockNextHint = useCallback(() => {
    setUnlockedHintLevel((prev) => {
      if (prev < 7) {
        const nextLevel = prev + 1;
        // Trigger fetch for the newly unlocked hint tier
        const activeCode = localStorage.getItem("codeinsight-code") || "";
        consultTutorApi("binary search", activeCode, nextLevel);
        return nextLevel;
      }
      return prev;
    });
  }, [consultTutorApi]);

  const resetTutor = useCallback(() => {
    setUnlockedHintLevel(1);
    setTutorResponse(null);
    setError(null);
  }, []);

  return (
    <TutorContext.Provider
      value={{
        tutorMode,
        setTutorMode,
        tutorProvider,
        setTutorProvider,
        unlockedHintLevel,
        setUnlockedHintLevel,
        tutorResponse,
        isLoading,
        error,
        consultTutorApi,
        unlockNextHint,
        resetTutor
      }}
    >
      {children}
    </TutorContext.Provider>
  );
}

export function useTutor() {
  const context = useContext(TutorContext);
  if (!context) {
    throw new Error("useTutor must be used within a TutorProvider");
  }
  return context;
}
