import React, { useState } from "react";
import { useExplanation } from "@/services/explanation-store";
import { usePlayback } from "@/services/playback-store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Pin,
  Star,
  Search,
  Trash2,
  Clock,
  HelpCircle,
  Check,
  ChevronDown,
  BookOpen,
} from "lucide-react";

export function AiMentorPanel() {
  const {
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
    toggleBookmarkExplanation,
    togglePinExplanation,
    isExplanationBookmarked,
    isExplanationPinned,
  } = useExplanation();

  const { jumpToStep } = usePlayback();

  const [activeSubTab, setActiveSubTab] = useState("mentor");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  // Accordion details toggle states
  const [expandedSections, setExpandedSections] = useState({
    vars: true,
    memory: false,
    loops: false,
    functions: false,
    dsa: true,
    insight: true,
    optimization: false,
  });

  const toggleSection = (sec) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleCopy = () => {
    if (!currentExplanation) return;
    const fullText = `
[Step ${currentExplanation.stepNumber} Line ${currentExplanation.currentLineNumber}]
Explanation: ${currentExplanation.explanation}
Variables: ${currentExplanation.variableChanges}
Memory: ${currentExplanation.memoryChanges}
Algorithm Insight: ${currentExplanation.algorithmInsight}
    `.trim();
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredHistory = useMemo(() => {
    return searchHistory(searchQuery, showBookmarksOnly);
  }, [searchQuery, showBookmarksOnly, searchHistory, history]);

  // Fallback useMemo
  function useMemo(factory, deps) {
    return React.useMemo(factory, deps);
  }

  return (
    <div className="flex flex-col h-full bg-[#111111] text-[var(--color-text-secondary)] select-none border border-[#232323] rounded-[var(--radius-sm)] overflow-hidden">
      {/* 1. Header Toolbar Switcher */}
      <div className="flex items-center justify-between border-b border-[#232323] bg-[#161616]/80 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5 font-sans font-bold text-caption text-[var(--color-text-primary)]">
          <Sparkles className="h-4 w-4 text-[#22C55E]" />
          <span>AI Programming Mentor</span>
        </div>

        {/* Tutor / History Subtab selector */}
        <div className="flex bg-[#0B0B0B] border border-[#232323] p-0.5 rounded text-micro font-bold">
          <button
            onClick={() => setActiveSubTab("mentor")}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
              activeSubTab === "mentor"
                ? "bg-[#22C55E] text-black"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Tutor
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
              activeSubTab === "history"
                ? "bg-[#22C55E] text-black"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* 2. Provider & Learning Tier Settings bar (Mentor view only) */}
      {activeSubTab === "mentor" && (
        <div className="flex flex-col gap-2 p-3 border-b border-[#232323] bg-[#161616]/30 shrink-0 text-micro">
          {/* Provider Selection */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 font-mono">LLM Provider:</span>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="h-7 rounded border border-[#232323] bg-[#0B0B0B] px-2 text-micro font-semibold text-zinc-300 cursor-pointer focus:outline-none"
            >
              <option value="mock">Offline Programming Mock</option>
              <option value="gemini">Google Gemini Pro API</option>
              <option value="openai">OpenAI GPT-4o API</option>
              <option value="ollama">Local Ollama Model</option>
            </select>
          </div>

          {/* Learning Mode selection */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 font-mono">Learning Tier:</span>
            <div className="flex bg-[#0B0B0B] border border-[#232323] p-0.5 rounded text-[10px] font-bold">
              {["beginner", "intermediate", "advanced"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLearningMode(mode)}
                  className={`px-2.5 py-0.5 rounded capitalize transition-all cursor-pointer ${
                    learningMode === mode
                      ? "bg-zinc-800 text-[#22C55E] border border-zinc-700/60"
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Panel Content Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* TUTOR MAIN TAB */}
          {activeSubTab === "mentor" && (
            <motion.div
              key="mentor-tab"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-3 p-3 min-h-0 select-text"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 font-mono text-micro select-none h-full">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#22C55E] border-t-transparent mb-3" />
                  <span className="animate-pulse">
                    AI Programming Mentor generating step logs...
                  </span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-red-500 font-sans text-micro border border-red-950/40 bg-red-950/10 rounded m-2">
                  <HelpCircle className="h-6 w-6 mb-2" />
                  <strong className="text-caption font-bold">
                    API Connection Standby
                  </strong>
                  <p className="mt-1 text-zinc-500 leading-relaxed max-w-[200px]">
                    Failed to connect to local Spring Boot sandbox: {error}.
                    Falling back to cached data.
                  </p>
                </div>
              ) : currentExplanation ? (
                <div className="flex flex-col gap-3">
                  {/* Active Explanation Core Card */}
                  <div className="flex flex-col gap-2.5 p-4 border border-[#232323] bg-[#0B0B0B] rounded-[var(--radius-sm)] shadow-[inset_0_0_12px_rgba(255,255,255,0.01)] relative group">
                    <div className="flex justify-between items-center border-b border-[#232323]/50 pb-2 mb-0.5 select-none font-sans text-micro">
                      <span className="font-bold text-zinc-500">
                        Step {currentExplanation.stepNumber} ·{" "}
                        <strong className="text-zinc-300">
                          Line {currentExplanation.currentLineNumber}
                        </strong>
                      </span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleCopy}
                          className="p-1 hover:bg-[#161616] text-zinc-500 hover:text-white rounded cursor-pointer transition-colors"
                          title="Copy Explanation text"
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            togglePinExplanation(currentExplanation.stepNumber)
                          }
                          className={`p-1 hover:bg-[#161616] rounded cursor-pointer transition-colors ${
                            isExplanationPinned(currentExplanation.stepNumber)
                              ? "text-[#22C55E]"
                              : "text-zinc-500 hover:text-white"
                          }`}
                          title="Pin Explanation"
                        >
                          <Pin className="h-3.5 w-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() =>
                            toggleBookmarkExplanation(
                              currentExplanation.stepNumber,
                            )
                          }
                          className={`p-1 hover:bg-[#161616] rounded cursor-pointer transition-colors ${
                            isExplanationBookmarked(
                              currentExplanation.stepNumber,
                            )
                              ? "text-amber-500"
                              : "text-zinc-500 hover:text-white"
                          }`}
                          title="Bookmark Explanation"
                        >
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Core description */}
                    <div className="text-[13px] text-zinc-300 leading-relaxed font-sans select-text">
                      {currentExplanation.explanation}
                    </div>
                  </div>

                  {/* 1. Algorithmic Insight Section */}
                  {currentExplanation.algorithmInsight && (
                    <div className="rounded-[var(--radius-sm)] border border-[#232323] bg-[#0B0B0B] overflow-hidden">
                      <button
                        onClick={() => toggleSection("insight")}
                        className="flex w-full items-center justify-between px-3 py-2 bg-[#161616]/40 text-micro font-bold text-zinc-400 hover:bg-[#161616] cursor-pointer"
                      >
                        <span className="uppercase tracking-wider">
                          Algorithmic Insight
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${expandedSections.insight ? "" : "-rotate-90"}`}
                        />
                      </button>
                      {expandedSections.insight && (
                        <div className="p-3 border-t border-[#232323] text-micro text-zinc-400 leading-relaxed select-text font-sans bg-[#080808]/40">
                          {currentExplanation.algorithmInsight}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Variables mutations reasoning accordion */}
                  <div className="rounded-[var(--radius-sm)] border border-[#232323] bg-[#0B0B0B] overflow-hidden">
                    <button
                      onClick={() => toggleSection("vars")}
                      className="flex w-full items-center justify-between px-3 py-2 bg-[#161616]/40 text-micro font-bold text-zinc-400 hover:bg-[#161616] cursor-pointer"
                    >
                      <span className="uppercase tracking-wider">
                        Variable Scope Mutations
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${expandedSections.vars ? "" : "-rotate-90"}`}
                      />
                    </button>
                    {expandedSections.vars && (
                      <div className="p-3 border-t border-[#232323] text-micro text-zinc-400 leading-relaxed select-text font-sans bg-[#080808]/40">
                        {currentExplanation.variableChanges}
                      </div>
                    )}
                  </div>

                  {/* 3. Memory Stack & Heap Allocations reasoning */}
                  <div className="rounded-[var(--radius-sm)] border border-[#232323] bg-[#0B0B0B] overflow-hidden">
                    <button
                      onClick={() => toggleSection("memory")}
                      className="flex w-full items-center justify-between px-3 py-2 bg-[#161616]/40 text-micro font-bold text-zinc-400 hover:bg-[#161616] cursor-pointer"
                    >
                      <span className="uppercase tracking-wider">
                        Memory Allocation Impact
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${expandedSections.memory ? "" : "-rotate-90"}`}
                      />
                    </button>
                    {expandedSections.memory && (
                      <div className="p-3 border-t border-[#232323] text-micro text-zinc-400 leading-relaxed select-text font-sans bg-[#080808]/40">
                        {currentExplanation.memoryChanges}
                      </div>
                    )}
                  </div>

                  {/* 4. Loop conditions details */}
                  {currentExplanation.loopExplanation &&
                    !currentExplanation.loopExplanation.startsWith(
                      "No active loops",
                    ) && (
                      <div className="rounded-[var(--radius-sm)] border border-[#232323] bg-[#0B0B0B] overflow-hidden">
                        <button
                          onClick={() => toggleSection("loops")}
                          className="flex w-full items-center justify-between px-3 py-2 bg-[#161616]/40 text-micro font-bold text-zinc-400 hover:bg-[#161616] cursor-pointer"
                        >
                          <span className="uppercase tracking-wider">
                            Loop Iteration Logic
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${expandedSections.loops ? "" : "-rotate-90"}`}
                          />
                        </button>
                        {expandedSections.loops && (
                          <div className="p-3 border-t border-[#232323] text-micro text-zinc-400 leading-relaxed select-text font-sans bg-[#080808]/40">
                            {currentExplanation.loopExplanation}
                          </div>
                        )}
                      </div>
                    )}

                  {/* 5. Recursion & Stack Frames detailed */}
                  {currentExplanation.functionExplanation && (
                    <div className="rounded-[var(--radius-sm)] border border-[#232323] bg-[#0B0B0B] overflow-hidden">
                      <button
                        onClick={() => toggleSection("functions")}
                        className="flex w-full items-center justify-between px-3 py-2 bg-[#161616]/40 text-micro font-bold text-zinc-400 hover:bg-[#161616] cursor-pointer"
                      >
                        <span className="uppercase tracking-wider">
                          Call Stack Activation
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${expandedSections.functions ? "" : "-rotate-90"}`}
                        />
                      </button>
                      {expandedSections.functions && (
                        <div className="p-3 border-t border-[#232323] text-micro text-zinc-400 leading-relaxed select-text font-sans bg-[#080808]/40">
                          {currentExplanation.functionExplanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. DSA Structural Operation detailed */}
                  {currentExplanation.dsaExplanation &&
                    !currentExplanation.dsaExplanation.startsWith(
                      "Active structure",
                    ) && (
                      <div className="rounded-[var(--radius-sm)] border border-[#232323] bg-[#0B0B0B] overflow-hidden">
                        <button
                          onClick={() => toggleSection("dsa")}
                          className="flex w-full items-center justify-between px-3 py-2 bg-[#161616]/40 text-micro font-bold text-zinc-400 hover:bg-[#161616] cursor-pointer"
                        >
                          <span className="uppercase tracking-wider">
                            Structure Mutation (DSA)
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${expandedSections.dsa ? "" : "-rotate-90"}`}
                          />
                        </button>
                        {expandedSections.dsa && (
                          <div className="p-3 border-t border-[#232323] text-micro text-zinc-400 leading-relaxed select-text font-sans bg-[#080808]/40">
                            {currentExplanation.dsaExplanation}
                          </div>
                        )}
                      </div>
                    )}

                  {/* 7. Code Optimization Tips */}
                  {currentExplanation.optimizationTip && (
                    <div className="rounded-[var(--radius-sm)] border border-emerald-950 bg-emerald-950/10 overflow-hidden">
                      <button
                        onClick={() => toggleSection("optimization")}
                        className="flex w-full items-center justify-between px-3 py-2 bg-emerald-950/20 text-micro font-bold text-emerald-400 hover:bg-emerald-950/30 cursor-pointer"
                      >
                        <span className="uppercase tracking-wider">
                          💡 Optimization Hint
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-emerald-400 transition-transform ${expandedSections.optimization ? "" : "-rotate-90"}`}
                        />
                      </button>
                      {expandedSections.optimization && (
                        <div className="p-3 border-t border-emerald-950/30 text-micro text-emerald-300/80 leading-relaxed select-text font-sans bg-emerald-950/5">
                          {currentExplanation.optimizationTip}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro select-none h-full">
                  <BookOpen className="h-7 w-7 mb-2 stroke-[1.5] text-[#22C55E] opacity-40 animate-pulse" />
                  <span>AI Mentor Standby.</span>
                  <p className="text-[10px] mt-1 text-zinc-700 max-w-[200px]">
                    Compile and execute program traces to start receiving
                    line-by-line coding tutor logs.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* HISTORY LOGS TAB */}
          {activeSubTab === "history" && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-3 p-3 min-h-0"
            >
              {/* Search & filters controls */}
              <div className="flex flex-col gap-2 shrink-0">
                <div className="relative flex items-center bg-[#0B0B0B] border border-[#232323] rounded px-2">
                  <Search className="h-3.5 w-3.5 text-zinc-600 mr-2" />
                  <input
                    type="text"
                    placeholder="Search past explanations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 bg-transparent text-micro text-zinc-300 focus:outline-none placeholder-zinc-700"
                  />
                </div>

                <div className="flex justify-between items-center text-micro">
                  <button
                    onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                      showBookmarksOnly
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                        : "border-[#232323] hover:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>Starred Only</span>
                  </button>

                  <button
                    onClick={clearHistory}
                    className="flex items-center gap-1.5 text-zinc-500 hover:text-red-500 font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear logs</span>
                  </button>
                </div>
              </div>

              {/* History list */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 scrollbar-thin select-none">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => jumpToStep(item.stepNumber - 1)}
                    className="flex flex-col gap-1.5 p-3 rounded border border-[#232323] bg-[#0B0B0B] hover:border-zinc-700 cursor-pointer transition-all relative group"
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono select-none">
                      <span className="font-bold text-zinc-500">
                        Step {item.stepNumber}{" "}
                        <span className="opacity-50 font-normal">
                          ({item.mode})
                        </span>
                      </span>
                      <span className="text-zinc-600">
                        Line {item.currentLineNumber}
                      </span>
                    </div>

                    <p className="text-micro text-zinc-300 line-clamp-3 select-text leading-relaxed font-sans">
                      {item.explanation}
                    </p>

                    <div className="flex items-center justify-between text-[8px] text-zinc-600 font-sans mt-0.5 select-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Provider: {item.provider}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                ))}

                {filteredHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro select-none">
                    <Clock className="h-6 w-6 stroke-[1.5] mb-1.5 opacity-40 animate-pulse text-[#22C55E]" />
                    <span>History log is empty.</span>
                    <p className="text-[10px] mt-1 text-zinc-700 max-w-[200px]">
                      Step through execution trace to compile histories logs.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
