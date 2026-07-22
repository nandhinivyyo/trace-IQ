import React, { useState, useEffect } from "react";
import { useTutor } from "@/services/tutor-store.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  Search,
  CheckCircle,
  AlertTriangle,
  Play
} from "lucide-react";

export function AiTutorPanel() {
  const {
    tutorMode,
    setTutorMode,
    tutorProvider,
    setTutorProvider,
    unlockedHintLevel,
    tutorResponse,
    isLoading,
    error,
    consultTutorApi,
    unlockNextHint,
    resetTutor
  } = useTutor();

  const [activeTab, setActiveTab] = useState("hints");

  // Consult API on mount or when mode/provider changes
  useEffect(() => {
    const activeCode = localStorage.getItem("codeinsight-code") || "";
    consultTutorApi("binary search", activeCode);
  }, [tutorMode, tutorProvider, consultTutorApi]);

  const handleAnalyzeAttempt = () => {
    const activeCode = localStorage.getItem("codeinsight-code") || "";
    consultTutorApi("binary search", activeCode);
  };

  const handleReset = () => {
    resetTutor();
    const activeCode = localStorage.getItem("codeinsight-code") || "";
    consultTutorApi("binary search", activeCode, 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] text-[var(--color-text-secondary)] select-none border border-[#232323] rounded-[var(--radius-sm)] overflow-hidden">
      
      {/* 1. Header Toolbar Switcher */}
      <div className="flex items-center justify-between border-b border-[#232323] bg-[#161616]/80 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5 font-sans font-bold text-caption text-[var(--color-text-primary)]">
          <Sparkles className="h-4 w-4 text-[#22C55E] animate-pulse" />
          <span>Socratic AI Tutor</span>
        </div>
        
        {/* Tutor mode pill selector */}
        <div className="flex bg-[#0B0B0B] border border-[#232323] p-0.5 rounded text-[10px] font-bold">
          {["hint", "socratic", "teaching"].map((m) => (
            <button
              key={m}
              onClick={() => setTutorMode(m)}
              className={`px-2 py-0.5 rounded capitalize transition-all cursor-pointer ${
                tutorMode === m
                  ? "bg-[#22C55E] text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Provider Settings bar */}
      <div className="flex flex-col gap-2 p-3 border-b border-[#232323] bg-[#161616]/30 shrink-0 text-micro">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 font-mono">Tutor LLM:</span>
          <select
            value={tutorProvider}
            onChange={(e) => setTutorProvider(e.target.value)}
            className="h-7 rounded border border-[#232323] bg-[#0B0B0B] px-2 text-micro font-semibold text-zinc-300 cursor-pointer focus:outline-none"
          >
            <option value="mock">Offline Mock Mentor</option>
            <option value="gemini">Google Gemini Pro</option>
            <option value="openai">OpenAI GPT-4o</option>
            <option value="ollama">Local Ollama Llama3</option>
          </select>
        </div>
      </div>

      {/* 3. Panel tabs */}
      <div className="flex border-b border-[#232323] bg-[#161616]/20 overflow-x-auto text-[10px] font-bold text-zinc-300 select-none scrollbar-none shrink-0">
        {[
          { id: "hints", label: "Layered Hints" },
          { id: "socratic", label: "Socratic Qs" },
          { id: "teaching", label: "Structured" },
          { id: "attempt", label: "Analyze Code" },
          { id: "dsa", label: "DSA & Algos" },
          { id: "roadmap", label: "Roadmap" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 border-b-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === tab.id
                ? "border-[#22C55E] text-zinc-200 bg-[#0B0B0B]"
                : "border-transparent text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Contents area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 font-mono text-micro h-full">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#22C55E] border-t-transparent mb-3" />
            <span className="animate-pulse">AI Programming Tutor thinking...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-red-500 font-sans text-micro border border-red-950/40 bg-red-950/10 rounded">
            <HelpCircle className="h-6 w-6 mb-2" />
            <strong className="text-caption font-bold">Tutor API Offline</strong>
            <p className="mt-1 text-zinc-500 leading-relaxed max-w-[200px]">Could not contact sandbox backend: {error}. Check terminal logs.</p>
          </div>
        ) : tutorResponse ? (
          <AnimatePresence mode="wait">
            
            {/* TABS 1: HINTS */}
            {activeTab === "hints" && (
              <motion.div
                key="hints"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between font-sans text-micro border-b border-[#232323]/50 pb-2">
                  <span className="text-zinc-400 font-bold">Hints Unlocked: {unlockedHintLevel} / 7</span>
                  <button
                    onClick={handleReset}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold underline cursor-pointer"
                  >
                    Reset Locks
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {tutorResponse.hints.slice(0, unlockedHintLevel).map((hint, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 border border-[#232323] bg-[#0B0B0B] rounded text-micro text-zinc-300 leading-relaxed font-sans select-text"
                    >
                      {hint}
                    </motion.div>
                  ))}
                  
                  {unlockedHintLevel < 7 && (
                    <button
                      onClick={unlockNextHint}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-[#22C55E]/40 hover:border-[#22C55E]/70 bg-[#22C55E]/5 text-micro font-bold text-[#22C55E] rounded transition-all cursor-pointer"
                    >
                      <span>Reveal Next Hint</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* TABS 2: SOCRATIC QUESTIONS */}
            {activeTab === "socratic" && (
              <motion.div
                key="socratic"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider block border-b border-[#232323]/50 pb-1.5">Socratic Guiding Prompts</span>
                <div className="flex flex-col gap-2.5">
                  {tutorResponse.socraticQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 p-3 border border-[#232323] bg-[#0B0B0B] rounded text-micro text-zinc-300 leading-relaxed select-text"
                    >
                      <span className="text-[#22C55E] font-bold font-mono">Q:</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TABS 3: TEACHING EXPLANATIONS */}
            {activeTab === "teaching" && (
              <motion.div
                key="teaching"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 border border-[#232323] bg-[#0B0B0B] rounded text-micro text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap select-text max-h-[400px] overflow-y-auto"
              >
                {tutorResponse.teachingExplanation}
              </motion.div>
            )}

            {/* TABS 4: CODE ATTEMPT ANALYSIS */}
            {activeTab === "attempt" && (
              <motion.div
                key="attempt"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider">Logic Assessment</span>
                  <button
                    onClick={handleAnalyzeAttempt}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-[#232323] bg-[#161616] hover:bg-[#1C1C1C] text-zinc-300 rounded cursor-pointer transition-colors"
                  >
                    <Play className="h-3 w-3 fill-current text-[#22C55E]" />
                    <span>Re-Analyze</span>
                  </button>
                </div>

                <div className="p-3.5 border border-[#232323] bg-[#0B0B0B] rounded text-micro leading-relaxed text-zinc-300 select-text font-sans whitespace-pre-wrap">
                  {tutorResponse.attemptAnalysis}
                </div>

                {tutorResponse.feedbackSummary && (
                  <div className="p-3.5 border border-emerald-950/40 bg-emerald-950/10 rounded text-micro leading-relaxed text-emerald-300 font-sans whitespace-pre-wrap">
                    <strong className="text-[10px] text-emerald-400 block mb-1 font-bold uppercase tracking-wider">Tutor Feedback Summary:</strong>
                    {tutorResponse.feedbackSummary}
                  </div>
                )}
              </motion.div>
            )}

            {/* TABS 5: DSA AND ALGORITHMS */}
            {activeTab === "dsa" && (
              <motion.div
                key="dsa"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3.5"
              >
                {/* Patterns */}
                <div className="flex flex-col gap-2">
                  <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider block border-b border-[#232323]/50 pb-1.5">Algorithmic Patterns</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tutorResponse.patterns.map((pat, idx) => (
                      <span
                        key={idx}
                        className="bg-zinc-800/80 border border-zinc-700/60 text-[#22C55E] px-2 py-0.5 rounded text-[10px] font-medium font-sans"
                      >
                        {pat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Data Structures */}
                <div className="flex flex-col gap-2">
                  <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider block border-b border-[#232323]/50 pb-1.5">Data Structures Required</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tutorResponse.dataStructures.map((ds, idx) => (
                      <span
                        key={idx}
                        className="bg-[#0B0B0B] border border-[#232323] text-zinc-300 px-2 py-0.5 rounded text-[10px] font-mono"
                      >
                        {ds}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Algorithms */}
                <div className="flex flex-col gap-2">
                  <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider block border-b border-[#232323]/50 pb-1.5">Target Algorithms</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tutorResponse.algorithms.map((alg, idx) => (
                      <span
                        key={idx}
                        className="bg-[#0B0B0B] border border-[#232323] text-zinc-300 px-2 py-0.5 rounded text-[10px] font-medium font-sans"
                      >
                        {alg}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TABS 6: ROADMAP & RELATED */}
            {activeTab === "roadmap" && (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3.5"
              >
                {/* Roadmap tracker */}
                <div className="flex flex-col gap-2">
                  <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider block border-b border-[#232323]/50 pb-1.5">Topic Progression Path</span>
                  <div className="space-y-2">
                    {tutorResponse.roadmap.map((track, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-micro font-sans"
                      >
                        <CheckCircle className={`h-4 w-4 ${idx === 0 ? "text-[#22C55E]" : "text-zinc-700"}`} />
                        <span className={idx === 0 ? "text-zinc-200 font-bold" : "text-zinc-500"}>{track}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Practice Problems */}
                <div className="flex flex-col gap-2">
                  <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider block border-b border-[#232323]/50 pb-1.5">Suggested Exercises</span>
                  <div className="space-y-1.5">
                    {tutorResponse.relatedProblems.map((prob, idx) => (
                      <div
                        key={idx}
                        className="p-2 border border-[#232323] bg-[#0B0B0B] rounded text-[10.5px] leading-relaxed text-zinc-400 font-sans"
                      >
                        {prob}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro h-full">
            <BookOpen className="h-7 w-7 mb-2 stroke-[1.5] text-[#22C55E] opacity-40 animate-pulse" />
            <span>AI Tutor Standby.</span>
            <p className="text-[10px] mt-1 text-zinc-700 max-w-[200px]">Begin typing code or trigger analysis checks to start your Socratic mentorship.</p>
          </div>
        )}
      </div>

    </div>
  );
}
