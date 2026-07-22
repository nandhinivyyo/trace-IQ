import React, { useState, useEffect } from "react";
import { useDebugger } from "@/services/debugger-store.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertTriangle,
  FileCode,
  Shield,
  Zap,
  BookOpen,
  PieChart,
  History,
  Copy,
  Check,
  CheckCircle,
  Play,
  RotateCcw
} from "lucide-react";

export function AiDebuggerPanel() {
  const {
    debugProvider,
    setDebugProvider,
    auditResponse,
    isLoading,
    error,
    runCodeAudit,
    resetDebugger
  } = useDebugger();

  const [activeTab, setActiveTab] = useState("errors");
  const [copiedId, setCopiedId] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);

  // Trigger default code audit on load if code exists
  useEffect(() => {
    const code = localStorage.getItem("codeinsight-code") || "";
    if (code) {
      runCodeAudit(code);
    }
  }, [debugProvider, runCodeAudit]);

  // Keep track of audit history logs
  useEffect(() => {
    if (auditResponse) {
      setAuditHistory((prev) => {
        const exists = prev.some((h) => h.timestamp === auditResponse.timestamp || h.score === auditResponse.overallQualityScore && h.timeComplexity === auditResponse.timeComplexity);
        if (exists) return prev;
        return [
          {
            score: auditResponse.overallQualityScore,
            timeComplexity: auditResponse.timeComplexity,
            spaceComplexity: auditResponse.spaceComplexity,
            issueCount: auditResponse.issues.length,
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ].slice(0, 10); // cap at 10 items
      });
    }
  }, [auditResponse]);

  const handleRunAudit = () => {
    const code = localStorage.getItem("codeinsight-code") || "";
    runCodeAudit(code);
  };

  const handleCopyCode = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter issues by severity/type
  const errors = auditResponse ? auditResponse.issues.filter((i) => i.severity === "ERROR") : [];
  const warnings = auditResponse ? auditResponse.issues.filter((i) => i.severity === "WARNING") : [];
  const suggestions = auditResponse ? auditResponse.issues.filter((i) => i.severity === "INFO" || i.severity === "BEST_PRACTICE") : [];

  return (
    <div className="flex flex-col h-full bg-[#111111] text-[var(--color-text-secondary)] select-none border border-[#232323] rounded-[var(--radius-sm)] overflow-hidden">
      
      {/* 1. Panel Header */}
      <div className="flex items-center justify-between border-b border-[#232323] bg-[#161616]/80 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5 font-sans font-bold text-caption text-[var(--color-text-primary)]">
          <Zap className="h-4 w-4 text-[#22C55E]" />
          <span>AI Code Auditor & Debugger</span>
        </div>
        
        {/* Run Audit Button */}
        <button
          onClick={handleRunAudit}
          className="flex items-center gap-1.5 px-2.5 py-1 text-micro font-bold bg-[#22C55E] text-black rounded hover:bg-[#1EAE53] transition-all cursor-pointer"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>Audit Code</span>
        </button>
      </div>

      {/* 2. Provider Settings bar */}
      <div className="flex flex-col gap-2 p-3 border-b border-[#232323] bg-[#161616]/30 shrink-0 text-micro">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 font-mono">LLM Auditor:</span>
          <select
            value={debugProvider}
            onChange={(e) => setDebugProvider(e.target.value)}
            className="h-7 rounded border border-[#232323] bg-[#0B0B0B] px-2 text-micro font-semibold text-zinc-300 cursor-pointer focus:outline-none"
          >
            <option value="mock">Offline Code Analyzer</option>
            <option value="gemini">Google Gemini Pro 1.5</option>
            <option value="openai">OpenAI GPT-4o Agent</option>
            <option value="ollama">Ollama Llama3 Local</option>
          </select>
        </div>
      </div>

      {/* 3. Panel tabs */}
      <div className="flex border-b border-[#232323] bg-[#161616]/20 overflow-x-auto text-[10px] font-bold text-zinc-300 select-none scrollbar-none shrink-0">
        {[
          { id: "errors", label: `Errors (${errors.length})` },
          { id: "warnings", label: `Warnings (${warnings.length})` },
          { id: "suggestions", label: `Suggestions (${suggestions.length})` },
          { id: "optimization", label: "Optimization" },
          { id: "security", label: "Security" },
          { id: "review", label: "Code Review" },
          { id: "complexity", label: "Complexity" },
          { id: "history", label: "History" }
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

      {/* 4. Scrollable Content Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 font-mono text-micro h-full">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#22C55E] border-t-transparent mb-3" />
            <span className="animate-pulse">Analyzing codebase structures and logic pathways...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-red-500 font-sans text-micro border border-red-950/40 bg-red-950/10 rounded">
            <AlertTriangle className="h-6 w-6 mb-2" />
            <strong className="text-caption font-bold">Auditor API Standby</strong>
            <p className="mt-1 text-zinc-500 leading-relaxed max-w-[200px]">Could not contact backend diagnostic endpoints: {error}. falling back to cached details.</p>
          </div>
        ) : auditResponse ? (
          <AnimatePresence mode="wait">
            
            {/* TABS: ERRORS */}
            {activeTab === "errors" && (
              <motion.div
                key="errors"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                {errors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro">
                    <CheckCircle className="h-6 w-6 mb-2 text-[#22C55E] stroke-[1.5]" />
                    <span>No logical or syntax errors found.</span>
                  </div>
                ) : (
                  errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-red-950/40 bg-red-950/5 rounded flex flex-col gap-2 text-micro font-sans select-text leading-relaxed"
                    >
                      <div className="flex items-center justify-between border-b border-red-950/20 pb-1.5">
                        <span className="text-red-400 font-bold font-mono">Line {err.line} · {err.type}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-red-950 text-red-400 px-1 rounded">critical</span>
                      </div>
                      <div className="text-zinc-200 font-bold">{err.message}</div>
                      <div className="text-zinc-400"><strong className="text-zinc-500">Root Cause:</strong> {err.rootCause}</div>
                      <div className="text-zinc-400"><strong className="text-zinc-500">Reproduction:</strong> {err.reproduction}</div>
                      <div className="text-emerald-400/90"><strong className="text-emerald-500">Recommended Fix:</strong> {err.remedy}</div>
                      {err.commonMistake && (
                        <div className="text-amber-400/90 border-t border-red-950/10 pt-1.5 mt-0.5"><strong className="text-amber-500">Common Mistake:</strong> {err.commonMistake}</div>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* TABS: WARNINGS */}
            {activeTab === "warnings" && (
              <motion.div
                key="warnings"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                {warnings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro">
                    <CheckCircle className="h-6 w-6 mb-2 text-[#22C55E] stroke-[1.5]" />
                    <span>No logic warnings or smells detected.</span>
                  </div>
                ) : (
                  warnings.map((warn, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-amber-950/40 bg-amber-950/5 rounded flex flex-col gap-2 text-micro font-sans select-text leading-relaxed"
                    >
                      <div className="flex items-center justify-between border-b border-amber-950/20 pb-1.5">
                        <span className="text-amber-400 font-bold font-mono">Line {warn.line} · {warn.type}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-950 text-amber-400 px-1 rounded">warning</span>
                      </div>
                      <div className="text-zinc-200 font-bold">{warn.message}</div>
                      <div className="text-zinc-400"><strong className="text-zinc-500">Why it matters:</strong> {warn.rootCause}</div>
                      <div className="text-emerald-400/90"><strong className="text-emerald-500">Remedy Fix:</strong> {warn.remedy}</div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* TABS: SUGGESTIONS */}
            {activeTab === "suggestions" && (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                {suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro">
                    <CheckCircle className="h-6 w-6 mb-2 text-zinc-500 stroke-[1.5]" />
                    <span>No style or best-practice suggestions.</span>
                  </div>
                ) : (
                  suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-[#232323] bg-[#0B0B0B] rounded flex flex-col gap-2 text-micro font-sans select-text leading-relaxed"
                    >
                      <div className="flex items-center justify-between border-b border-[#232323] pb-1.5">
                        <span className="text-zinc-400 font-bold font-mono">Line {sug.line} · {sug.type}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 px-1 rounded">suggestion</span>
                      </div>
                      <div className="text-zinc-200">{sug.message}</div>
                      <div className="text-emerald-400/90"><strong className="text-emerald-500">Action:</strong> {sug.remedy}</div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* TABS: OPTIMIZATIONS (SIDE-BY-SIDE FIXED CODE) */}
            {activeTab === "optimization" && (
              <motion.div
                key="optimization"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3.5"
              >
                {/* Visual Diffs Remedies */}
                {auditResponse.remedies.map((rem, idx) => (
                  <div
                    key={idx}
                    className="border border-[#232323] bg-[#0B0B0B] rounded overflow-hidden flex flex-col"
                  >
                    <div className="flex items-center justify-between px-3 py-2 bg-[#161616] text-micro font-bold border-b border-[#232323]">
                      <span className="text-[#22C55E] uppercase tracking-wider">{rem.title} Fix Blueprint</span>
                      <button
                        onClick={() => handleCopyCode(rem.title, rem.code)}
                        className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white cursor-pointer transition-colors"
                      >
                        {copiedId === rem.title ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Fix</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 font-mono text-[11px] text-zinc-300 bg-[#060606] whitespace-pre select-text overflow-x-auto border-b border-[#232323] scrollbar-thin leading-relaxed">
                      {rem.code}
                    </div>

                    <div className="p-3 text-micro font-sans flex flex-col gap-1.5 leading-relaxed select-text">
                      <div className="text-zinc-400"><strong className="text-zinc-500">Pros:</strong> {rem.advantages}</div>
                      {rem.disadvantages && (
                        <div className="text-zinc-400"><strong className="text-zinc-500">Cons:</strong> {rem.disadvantages}</div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Optimizations list */}
                {auditResponse.optimizations && auditResponse.optimizations.length > 0 && (
                  <div className="p-3.5 border border-emerald-950/40 bg-emerald-950/10 rounded text-micro text-emerald-300 leading-relaxed font-sans select-text">
                    <strong className="text-[10px] text-emerald-400 block mb-1.5 font-bold uppercase tracking-wider">Additional Optimization Targets:</strong>
                    <ul className="list-disc pl-4 space-y-1">
                      {auditResponse.optimizations.map((opt, i) => (
                        <li key={i}>{opt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {/* TABS: SECURITY */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3.5 font-sans"
              >
                <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider block border-b border-[#232323]/50 pb-1.5">Security Vulnerabilities Assessment</span>
                
                {auditResponse.securityAlerts && auditResponse.securityAlerts.length > 0 ? (
                  auditResponse.securityAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-red-950/40 bg-red-950/5 rounded flex gap-2 text-micro leading-relaxed text-zinc-300 select-text"
                    >
                      <Shield className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{alert}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro">
                    <CheckCircle className="h-6 w-6 mb-2 text-[#22C55E] stroke-[1.5]" />
                    <span>No security warnings detected in search sweeps.</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* TABS: CODE REVIEW PANEL */}
            {activeTab === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 font-sans select-text"
              >
                {/* Score gauge */}
                <div className="flex items-center gap-4 p-3 border border-[#232323] bg-[#0B0B0B] rounded">
                  <div className="relative flex items-center justify-center shrink-0">
                    {/* SVG Gauge */}
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#1c1c1c" strokeWidth="4" fill="transparent" />
                      <circle cx="32" cy="32" r="28" stroke="#22C55E" strokeWidth="4" fill="transparent"
                              strokeDasharray="175.9"
                              strokeDashoffset={175.9 - (175.9 * auditResponse.overallQualityScore) / 100}
                              strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-caption font-bold text-zinc-200">{auditResponse.overallQualityScore}</span>
                  </div>

                  <div className="flex flex-col gap-0.5 text-micro">
                    <strong className="text-zinc-300 text-caption font-bold">Overall Code Quality Rating</strong>
                    <span className="text-zinc-500">Evaluates readability, conventions, reusability, and loops efficiency.</span>
                  </div>
                </div>

                {/* Reviews details */}
                <div className="space-y-3 text-micro leading-relaxed text-zinc-400">
                  <div className="p-3 border border-[#232323] bg-[#0B0B0B] rounded">
                    <strong className="text-[10px] text-zinc-200 font-bold block mb-1">Readability:</strong>
                    {auditResponse.readabilityReview}
                  </div>
                  <div className="p-3 border border-[#232323] bg-[#0B0B0B] rounded">
                    <strong className="text-[10px] text-zinc-200 font-bold block mb-1">Naming Conventions:</strong>
                    {auditResponse.namingReview}
                  </div>
                  <div className="p-3 border border-[#232323] bg-[#0B0B0B] rounded">
                    <strong className="text-[10px] text-zinc-200 font-bold block mb-1">Modularity & Separation:</strong>
                    {auditResponse.modularityReview}
                  </div>
                  <div className="p-3 border border-[#232323] bg-[#0B0B0B] rounded">
                    <strong className="text-[10px] text-zinc-200 font-bold block mb-1">Robustness & Maintenance:</strong>
                    {auditResponse.maintainabilityReview}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TABS: COMPLEXITY ESTIMATIONS */}
            {activeTab === "complexity" && (
              <motion.div
                key="complexity"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3.5 font-sans"
              >
                {/* Time & Space */}
                <div className="grid grid-cols-2 gap-3.5 select-text">
                  <div className="p-3 border border-[#232323] bg-[#0B0B0B] rounded flex flex-col gap-1 items-center justify-center text-center">
                    <span className="text-zinc-500 text-[10px] font-mono">Time Complexity</span>
                    <strong className="text-caption text-[#22C55E] font-bold font-mono">{auditResponse.timeComplexity}</strong>
                  </div>
                  <div className="p-3 border border-[#232323] bg-[#0B0B0B] rounded flex flex-col gap-1 items-center justify-center text-center">
                    <span className="text-zinc-500 text-[10px] font-mono">Space Complexity</span>
                    <strong className="text-caption text-zinc-300 font-bold font-mono">{auditResponse.spaceComplexity}</strong>
                  </div>
                </div>

                {/* Bottlenecks list */}
                {auditResponse.bottlenecks && auditResponse.bottlenecks.length > 0 && (
                  <div className="flex flex-col gap-2 select-text leading-relaxed">
                    <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider block border-b border-[#232323]/50 pb-1.5">Runtime Bottlenecks Detected</span>
                    <div className="space-y-1.5">
                      {auditResponse.bottlenecks.map((bot, i) => (
                        <div
                          key={i}
                          className="p-2.5 border border-[#232323] bg-[#0B0B0B] rounded text-micro text-zinc-400"
                        >
                          {bot}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Concepts to Revise */}
                {auditResponse.conceptsToRevise && auditResponse.conceptsToRevise.length > 0 && (
                  <div className="p-3 border border-[#232323] bg-[#0B0B0B] rounded text-micro text-zinc-400 leading-relaxed select-text">
                    <strong className="text-[10px] text-zinc-200 font-bold block mb-1.5 uppercase tracking-wider">Concepts to Revise:</strong>
                    <ul className="list-disc pl-4 space-y-1">
                      {auditResponse.conceptsToRevise.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {/* TABS: HISTORY */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 font-sans"
              >
                <div className="flex items-center justify-between border-b border-[#232323]/50 pb-1.5 select-none">
                  <span className="text-zinc-500 text-micro font-bold uppercase tracking-wider">Past Audit Transcripts</span>
                  {auditHistory.length > 0 && (
                    <button
                      onClick={() => setAuditHistory([])}
                      className="text-[10px] text-zinc-500 hover:text-red-500 font-bold underline cursor-pointer"
                    >
                      Clear Log
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 select-none">
                  {auditHistory.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 border border-[#232323] bg-[#0B0B0B] rounded flex flex-col gap-1.5 text-micro leading-relaxed text-zinc-400"
                    >
                      <div className="flex justify-between items-center text-[10px] font-mono select-none">
                        <strong className="text-[#22C55E]">Quality Rating: {h.score}/100</strong>
                        <span className="text-zinc-600">{h.timestamp}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 select-text">
                        <div>Time: {h.timeComplexity}</div>
                        <div>Space: {h.spaceComplexity}</div>
                        <div>Bugs: {h.issueCount}</div>
                      </div>
                    </div>
                  ))}

                  {auditHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro">
                      <History className="h-6 w-6 stroke-[1.5] mb-2 opacity-40 animate-pulse text-[#22C55E]" />
                      <span>Audit history is empty.</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro h-full">
            <BookOpen className="h-7 w-7 mb-2 stroke-[1.5] text-[#22C55E] opacity-40 animate-pulse" />
            <span>Audit engine is ready.</span>
            <p className="text-[10px] mt-1 text-zinc-700 max-w-[200px]">Click 'Audit Code' above to execute diagnostic audits, reviews, and complexity reviews.</p>
          </div>
        )}
      </div>

    </div>
  );
}
