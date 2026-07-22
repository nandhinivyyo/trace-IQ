import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePlayback } from "./playback-store";

const ExplanationContext = createContext(undefined);

const CACHE_LOCAL_KEY = "codeinsight-explanation-cache";
const HISTORY_LOCAL_KEY = "codeinsight-explanation-history";
const BOOKMARKS_LOCAL_KEY = "codeinsight-explanation-bookmarks";
const PINNED_LOCAL_KEY = "codeinsight-explanation-pinned";

export function ExplanationProvider({ children }) {
  const { traces, currentStepIdx } = usePlayback();

  // Core settings states
  const [learningMode, setLearningMode] = useState(
    () => localStorage.getItem("codeinsight-learning-mode") || "intermediate",
  );
  const [aiProvider, setAiProvider] = useState(
    () => localStorage.getItem("codeinsight-ai-provider") || "mock",
  );

  // Load cache, history, bookmarks from localStorage
  const [explanationCache, setExplanationCache] = useState(() => {
    try {
      const saved = localStorage.getItem(CACHE_LOCAL_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_LOCAL_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_LOCAL_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(PINNED_LOCAL_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentExplanation, setCurrentExplanation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem("codeinsight-learning-mode", learningMode);
  }, [learningMode]);

  useEffect(() => {
    localStorage.setItem("codeinsight-ai-provider", aiProvider);
  }, [aiProvider]);

  // Sync cache, history, bookmarks
  useEffect(() => {
    localStorage.setItem(CACHE_LOCAL_KEY, JSON.stringify(explanationCache));
  }, [explanationCache]);

  useEffect(() => {
    localStorage.setItem(HISTORY_LOCAL_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(BOOKMARKS_LOCAL_KEY, JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  useEffect(() => {
    localStorage.setItem(PINNED_LOCAL_KEY, JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  // Fetch explanation logic
  const fetchExplanationForStep = useCallback(
    async (stepIdx) => {
      if (stepIdx === -1 || traces.length === 0) {
        setCurrentExplanation(null);
        return;
      }
      const stepData = traces[stepIdx];
      const stepNum = stepData.stepNumber;

      // Cache key maps to index + learning tier + provider selection
      const cacheKey = `${stepIdx}_${learningMode}_${aiProvider}`;
      if (explanationCache[cacheKey]) {
        setCurrentExplanation(explanationCache[cacheKey]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const activeCode =
          localStorage.getItem("codeinsight-code") ||
          stepData.executedSourceCode ||
          "";
        const activeLang = localStorage.getItem("codeinsight-lang") || "python";

        const response = await fetch("http://localhost:8080/api/ai/explain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: activeCode,
            language: activeLang,
            learningMode: learningMode.toUpperCase(),
            provider: aiProvider.toUpperCase(),
            stepNumber: stepNum,
            currentLineNumber: stepData.currentLineNumber,
            executedSourceCode: stepData.executedSourceCode,
            currentFunction: stepData.currentFunction,
            variablesAfter: stepData.variablesAfter,
            functionStack: stepData.functionStack,
            loopInformation: stepData.loopInformation,
            currentConsoleOutput: stepData.currentConsoleOutput,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Explanation server request failed: ${response.statusText}`,
          );
        }

        const result = await response.json();

        // Write results into cache
        setExplanationCache((prev) => ({
          ...prev,
          [cacheKey]: result,
        }));

        // Append results to tutor history list
        setHistory((prev) => {
          const key = `${stepNum}_${learningMode}_${aiProvider}`;
          const exists = prev.some((h) => h.id === key);
          if (exists) return prev;

          const newItem = {
            ...result,
            id: key,
            mode: learningMode,
            provider: aiProvider,
            isBookmarked: bookmarkedIds.includes(key),
            isPinned: pinnedIds.includes(key),
            timestamp: new Date().toLocaleTimeString(),
          };
          return [...prev, newItem].sort((a, b) => a.stepNumber - b.stepNumber);
        });

        setCurrentExplanation(result);
      } catch (err) {
        console.error("AI Explanation engine request failed", err);
        setError(err.message || String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [
      traces,
      learningMode,
      aiProvider,
      explanationCache,
      bookmarkedIds,
      pinnedIds,
    ],
  );

  // Search through explanation histories
  const searchHistory = useCallback(
    (query, filterBookmark = false) => {
      return history.filter((item) => {
        const matchesQuery =
          item.explanation.toLowerCase().includes(query.toLowerCase()) ||
          item.algorithmInsight.toLowerCase().includes(query.toLowerCase()) ||
          (item.dsaExplanation &&
            item.dsaExplanation.toLowerCase().includes(query.toLowerCase()));
        const matchesBookmark =
          !filterBookmark || bookmarkedIds.includes(item.id);
        return matchesQuery && matchesBookmark;
      });
    },
    [history, bookmarkedIds],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setExplanationCache({});
    setBookmarkedIds([]);
    setPinnedIds([]);
    setCurrentExplanation(null);
  }, []);

  // Bookmarking explanations
  const toggleBookmarkExplanation = useCallback(
    (stepNum) => {
      const key = `${stepNum}_${learningMode}_${aiProvider}`;
      setBookmarkedIds((prev) => {
        const exists = prev.includes(key);
        const updated = exists
          ? prev.filter((id) => id !== key)
          : [...prev, key];
        // Update history in-place
        setHistory((prevHist) =>
          prevHist.map((h) =>
            h.id === key ? { ...h, isBookmarked: !exists } : h,
          ),
        );
        return updated;
      });
    },
    [learningMode, aiProvider],
  );

  const isExplanationBookmarked = useCallback(
    (stepNum) => {
      const key = `${stepNum}_${learningMode}_${aiProvider}`;
      return bookmarkedIds.includes(key);
    },
    [bookmarkedIds, learningMode, aiProvider],
  );

  // Pinning explanations
  const togglePinExplanation = useCallback(
    (stepNum) => {
      const key = `${stepNum}_${learningMode}_${aiProvider}`;
      setPinnedIds((prev) => {
        const exists = prev.includes(key);
        const updated = exists
          ? prev.filter((id) => id !== key)
          : [...prev, key];
        setHistory((prevHist) =>
          prevHist.map((h) => (h.id === key ? { ...h, isPinned: !exists } : h)),
        );
        return updated;
      });
    },
    [learningMode, aiProvider],
  );

  const isExplanationPinned = useCallback(
    (stepNum) => {
      const key = `${stepNum}_${learningMode}_${aiProvider}`;
      return pinnedIds.includes(key);
    },
    [pinnedIds, learningMode, aiProvider],
  );

  // Synchronize explanation generation automatically with active step indices
  useEffect(() => {
    if (traces.length > 0 && currentStepIdx !== -1) {
      fetchExplanationForStep(currentStepIdx);
    }
  }, [currentStepIdx, learningMode, aiProvider, traces.length]);

  return (
    <ExplanationContext.Provider
      value={{
        learningMode,
        setLearningMode,
        aiProvider,
        setAiProvider,
        currentExplanation,
        isLoading,
        error,
        history,
        clearHistory,
        searchHistory,
        bookmarkedIds,
        pinnedIds,
        toggleBookmarkExplanation,
        togglePinExplanation,
        isExplanationBookmarked,
        isExplanationPinned,
        fetchExplanationForStep,
      }}
    >
      {children}
    </ExplanationContext.Provider>
  );
}

export function useExplanation() {
  const context = useContext(ExplanationContext);
  if (!context) {
    throw new Error(
      "useExplanation must be used within an ExplanationProvider",
    );
  }
  return context;
}
