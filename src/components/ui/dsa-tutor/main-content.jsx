import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Search,
  BookOpen,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Bookmark,
  FileText,
  Star,
  Brain
} from "lucide-react";

export function DsaMainContent({
  activeProblem,
  onSearch,
  isLoading,
  currentLanguage,
  onLanguageChange,
  isBookmarked,
  onToggleBookmark,
  isFavorite,
  onToggleFavorite,
  onExplainAgain
}) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState("python");
  
  // Controlled accordion: only one section open at a time
  const [expandedSection, setExpandedSection] = useState("problem");

  // Dry run simulation timeline state
  const [dryRunStep, setDryRunStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimer = useRef(null);

  const [copiedSection, setCopiedSection] = useState(null);
  const [hoveredTerm, setHoveredTerm] = useState(null);

  const glossary = {
    "Hash Map": "A data structure storing key-value pairs with O(1) average lookup time.",
    "Two Pointers": "An algorithmic technique using two indices to scan an array from opposite ends or at different speeds.",
    "Binary Search": "A logarithmic O(log N) search algorithm that halves the search space at each step on a sorted collection.",
    "Time Complexity": "Measure of runtime growth relative to input size, often denoted in Big-O notation.",
    "Space Complexity": "Measure of extra memory footprint required by an algorithm during execution."
  };

  const handleCopyCode = (codeText, tabKey) => {
    navigator.clipboard.writeText(codeText);
    setCopiedSection(tabKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Reset timeline on problem load
  useEffect(() => {
    setDryRunStep(0);
    setIsPlaying(false);
  }, [activeProblem]);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      playbackTimer.current = setInterval(() => {
        setDryRunStep((prev) => {
          const maxSteps = activeProblem?.dryRun?.length || 0;
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
    }
    return () => {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
    };
  }, [isPlaying, activeProblem]);

  const toggleSection = (sectionKey) => {
    setExpandedSection((prev) => (prev === sectionKey ? null : sectionKey));
  };

  const triggerSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSearch(searchQuery);
  };

  const exportNotesAsText = () => {
    const content = `DSA Tutor Notes - ${activeProblem?.title}\nCategory: ${activeProblem?.category}\nDifficulty: ${activeProblem?.difficulty}\n\nProblem Statement:\n${activeProblem?.problemStatement?.question}\n\nOptimal Approach:\n${activeProblem?.optimalApproach?.thinkingProcess}`;
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${activeProblem?.id || "dsa"}_notes.txt`;
    link.click();
    confetti({ particleCount: 65, spread: 45 });
  };

  const generateComplexityChartData = () => {
    return [
      { name: "N=2", "Brute Force (N^2)": 4, "Optimal (N)": 2, "Binary Search (log N)": 1 },
      { name: "N=4", "Brute Force (N^2)": 16, "Optimal (N)": 4, "Binary Search (log N)": 2 },
      { name: "N=8", "Brute Force (N^2)": 64, "Optimal (N)": 8, "Binary Search (log N)": 3 },
      { name: "N=16", "Brute Force (N^2)": 256, "Optimal (N)": 16, "Binary Search (log N)": 4 },
      { name: "N=32", "Brute Force (N^2)": 1024, "Optimal (N)": 32, "Binary Search (log N)": 5 }
    ];
  };

  const renderVisualExplanation = () => {
    const diag = activeProblem?.diagram;
    if (!diag) return <span className="text-[var(--color-text-secondary)] italic">No visual diagram coordinate configurations available.</span>;

    const elements = diag.elements || [1, 2, 3, 4];
    const steps = diag.steps || [];
    const activeStepData = steps[dryRunStep] || steps[steps.length - 1] || { pointers: {} };
    const pointers = activeStepData.pointers || {};
    const highlights = activeStepData.highlights || [];

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-xl my-3 select-none">
        <div className="flex items-center gap-4 mb-8">
          {elements.map((el, idx) => {
            const isHighlighted = highlights.includes(idx);
            const activePtrs = Object.entries(pointers)
              .filter(([name, pos]) => pos === idx)
              .map(([name]) => name);

            return (
              <div key={idx} className="flex flex-col items-center relative">
                <div className="h-6 flex items-center justify-center gap-0.5 absolute -top-8">
                  {activePtrs.map((name) => (
                    <span
                      key={name}
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        name === "left" || name === "L" || name === "i"
                          ? "bg-[var(--color-accent)] text-black"
                          : "bg-cyan-500 text-black"
                      }`}
                    >
                      {name}
                    </span>
                  ))}
                </div>

                <motion.div
                  animate={{
                    scale: isHighlighted ? 1.05 : 1,
                    borderColor: isHighlighted ? "var(--color-accent)" : "var(--color-border)",
                    backgroundColor: isHighlighted ? "var(--color-accent-subtle)" : "var(--color-canvas)"
                  }}
                  className="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-body font-mono font-bold text-[var(--color-text-primary)] transition-all"
                >
                  {el}
                </motion.div>
                <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono mt-1.5">idx {idx}</span>
              </div>
            );
          })}
        </div>

        <div className="w-full text-center border-t border-[var(--color-border)] pt-4">
          <p className="text-caption font-semibold text-[var(--color-text-secondary)] leading-relaxed">
            {activeStepData.description}
          </p>
        </div>
      </div>
    );
  };

  const AccordionSection = ({ title, sectionKey, children }) => {
    const isOpen = expandedSection === sectionKey;
    const elementRef = useRef(null);

    useEffect(() => {
      if (isOpen && elementRef.current) {
        // Wait briefly for previous collapses to start, then scroll into view smoothly
        const timer = setTimeout(() => {
          elementRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
          });
        }, 120);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    return (
      <div
        ref={elementRef}
        className="bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-2xl shadow-[var(--shadow-panel)] overflow-hidden transition-all hover:border-[var(--color-border-strong)] duration-200"
      >
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-6 py-4 text-left font-bold text-[15px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-surface-elevated)]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full transition-all duration-300 ${isOpen ? "bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]" : "bg-zinc-500"}`} />
            <span>{title}</span>
          </div>
          <span className="text-[var(--color-text-tertiary)] font-mono text-[12px]">{isOpen ? "▼" : "▶"}</span>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="px-6 pb-6 pt-2 border-t border-[var(--color-border-subtle)]/40 text-[13.5px] text-[var(--color-text-secondary)] leading-relaxed space-y-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-canvas)] p-8 h-full scrollbar-thin select-text">
      
      {/* Redesigned Search Panel Area */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-md mb-8">
        <h2 className="text-title-sm font-bold text-[var(--color-text-primary)] mb-3.5 flex items-center gap-2.5 select-none">
          <Brain className="h-5.5 w-5.5 text-[var(--color-accent)]" />
          <span>Search a DSA Problem</span>
        </h2>
        
        <form onSubmit={triggerSearchSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problem title or paste LeetCode / GeeksForGeeks / HackerRank URL..."
              className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl py-4 pl-12 pr-4 text-body text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-zinc-500 text-[14px]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 select-none">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-black font-bold rounded-xl text-body-sm flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.25)] hover:scale-[1.01]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Consult AI</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Language Dropdown */}
              <div className="flex items-center gap-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3.5 py-2 rounded-xl text-caption">
                <span className="text-[var(--color-text-tertiary)] font-semibold">Language:</span>
                <select
                  value={i18n.language}
                  onChange={(e) => {
                    const lang = e.target.value;
                    i18n.changeLanguage(lang);
                    onLanguageChange(lang);
                  }}
                  className="bg-transparent border-none outline-none text-[var(--color-text-primary)] cursor-pointer font-sans font-bold"
                >
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="en">English</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="ta">தமிழ் (Tamil)</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="hi">हिन्दी (Hindi)</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="te">తెలుగు (Telugu)</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="ml">മലയാളം (Malayalam)</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="bn">বাংলা (Bangla)</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="de">Deutsch</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="es">Español</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="fr">Français</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="ja">日本語</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="zh">中文</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="ko">한국어</option>
                </select>
              </div>

              {/* Code Language Dropdown */}
              <div className="flex items-center gap-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3.5 py-2 rounded-xl text-caption">
                <span className="text-[var(--color-text-tertiary)] font-semibold">Code:</span>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-transparent border-none outline-none text-[var(--color-text-primary)] cursor-pointer font-sans font-bold capitalize"
                >
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="python">Python</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="java">Java</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="cpp">C++</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="javascript">JavaScript</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="typescript">TypeScript</option>
                  <option className="bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]" value="go">Go</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-[var(--color-text-secondary)]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
          <span className="text-body-sm font-semibold animate-pulse">AI Tutor is generating dynamic explanations...</span>
        </div>
      ) : activeProblem ? (
        <div className="space-y-6 select-text">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-5">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-heading font-extrabold text-[var(--color-text-primary)] tracking-tight">
                  {activeProblem.title}
                </h1>
                
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider select-none ${
                    activeProblem.difficulty === "Easy"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : activeProblem.difficulty === "Medium"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  {activeProblem.difficulty}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 pt-1 select-none">
                {activeProblem.companyTags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] px-2.5 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 select-none">
              <button
                onClick={onToggleBookmark}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] cursor-pointer transition-colors ${
                  isBookmarked ? "text-amber-400 border-amber-400/30" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
                title="Bookmark Explanation"
              >
                <Bookmark className={`h-4.5 w-4.5 ${isBookmarked ? "fill-amber-400" : ""}`} />
              </button>
              
              <button
                onClick={onToggleFavorite}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] cursor-pointer transition-colors ${
                  isFavorite ? "text-red-500 border-red-500/30" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
                title="Save to Favorites"
              >
                <Star className={`h-4.5 w-4.5 ${isFavorite ? "fill-red-500" : ""}`} />
              </button>

              <button
                onClick={exportNotesAsText}
                className="flex h-10 px-4 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-caption font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Export</span>
              </button>

              <div className="h-10 flex items-center border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface-raised)]">
                <button
                  onClick={() => onExplainAgain("beginner")}
                  className="px-3 h-full text-micro font-bold border-r border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] cursor-pointer text-[var(--color-text-secondary)]"
                >
                  Beginner
                </button>
                <button
                  onClick={() => onExplainAgain("intermediate")}
                  className="px-3 h-full text-micro font-bold border-r border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] cursor-pointer text-[var(--color-text-secondary)]"
                >
                  Inter
                </button>
                <button
                  onClick={() => onExplainAgain("advanced")}
                  className="px-3 h-full text-micro font-bold hover:bg-[var(--color-surface-elevated)] cursor-pointer text-[var(--color-text-secondary)]"
                >
                  Adv
                </button>
              </div>
            </div>
          </div>

          {/* Stats indicators grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-2xl text-left select-none">
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">Est. Reading Time</span>
              <p className="text-[14px] font-bold text-[var(--color-text-primary)]">{activeProblem.readingTime || "5 mins"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">Interview Confidence</span>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 bg-[var(--color-canvas)] h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${activeProblem.confidenceScore || 80}%` }} />
                </div>
                <span className="text-micro font-bold text-emerald-400">{activeProblem.confidenceScore || 80}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">Pattern Difficulty</span>
              <p className="text-[14px] font-bold text-[var(--color-text-primary)]">{activeProblem.patternDifficulty || "Easy"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">Learning Progress</span>
              <p className="text-[14px] font-bold text-[var(--color-accent-text)]">Active Workspace</p>
            </div>
          </div>

          {/* Glossary helper bar */}
          <div className="p-4 bg-[var(--color-accent-subtle)] border border-[var(--color-accent-subtle-border)]/50 rounded-2xl text-caption leading-relaxed text-[var(--color-text-secondary)] flex items-start gap-3 select-none">
            <Brain className="h-5 w-5 text-[var(--color-accent-text)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[var(--color-text-primary)] text-[13px]">Technical glossary hover inspector:</span>
              <p>
                Hover over terms like{" "}
                {Object.keys(glossary).map((term) => (
                  <span
                    key={term}
                    onMouseEnter={() => setHoveredTerm(term)}
                    onMouseLeave={() => setHoveredTerm(null)}
                    className="underline decoration-[var(--color-accent)] decoration-dashed cursor-help font-semibold text-[var(--color-text-primary)] mx-0.5"
                  >
                    {term}
                  </span>
                ))}{" "}
                to check quick inline definitions.
              </p>
              {hoveredTerm && (
                <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] p-3 rounded-xl shadow-xl animate-fadeIn text-caption text-[var(--color-text-secondary)] font-sans mt-2.5 max-w-sm">
                  <strong className="text-emerald-400 font-mono font-bold block mb-1">{hoveredTerm}:</strong>
                  {glossary[hoveredTerm]}
                </div>
              )}
            </div>
          </div>

          {/* Accordion Lists */}
          <div className="space-y-5">
            
            {/* 1. Problem Statement */}
            <AccordionSection title="Problem Statement" sectionKey="problem">
              <div className="text-[var(--color-text-secondary)] leading-relaxed space-y-2 text-[13.5px]">
                <ReactMarkdown>{activeProblem.problemStatement?.question}</ReactMarkdown>
              </div>
              {activeProblem.problemStatement?.subText && (
                <p className="mt-2 text-[var(--color-text-tertiary)] text-[13px] italic">{activeProblem.problemStatement.subText}</p>
              )}
              {activeProblem.problemStatement?.constraints && (
                <div className="mt-4 space-y-1.5 bg-[var(--color-canvas)] p-4 border border-[var(--color-border)] rounded-xl select-none">
                  <strong className="text-micro text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">Constraints:</strong>
                  {activeProblem.problemStatement.constraints.map((c) => (
                    <div key={c} className="text-caption font-mono text-[var(--color-text-secondary)]">- {c}</div>
                  ))}
                </div>
              )}
            </AccordionSection>

            {/* 2. Understand Like a Beginner */}
            <AccordionSection title="Understand Like a Beginner" sectionKey="beginner">
              <p className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">{activeProblem.beginnerExplanation}</p>
            </AccordionSection>

            {/* 3. Real Life Example */}
            {activeProblem.realLifeAnalogy && (
              <AccordionSection title="Real Life Example" sectionKey="analogy">
                <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] p-4 rounded-xl flex items-start gap-3.5">
                  <BookOpen className="h-5.5 w-5.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[14px] font-bold text-[var(--color-text-primary)] mb-1">
                      {activeProblem.realLifeAnalogy.title}
                    </h4>
                    <p className="text-[13.5px] text-[var(--color-text-secondary)] leading-relaxed">{activeProblem.realLifeAnalogy.description}</p>
                  </div>
                </div>
              </AccordionSection>
            )}

            {/* 4. Brute Force */}
            <AccordionSection title="Brute Force" sectionKey="brute">
              {activeProblem.bruteForce && (
                <div className="space-y-4">
                  <p className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">{activeProblem.bruteForce.idea}</p>
                  <div className="grid grid-cols-2 gap-5 text-caption border-t border-[var(--color-border)]/60 pt-4 select-none">
                    <div>
                      <strong className="text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">Complexity:</strong>
                      <span className="font-mono text-[var(--color-text-primary)]">{activeProblem.bruteForce.complexity}</span>
                    </div>
                    <div>
                      <strong className="text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">Pros:</strong>
                      <span className="text-[var(--color-text-secondary)]">{activeProblem.bruteForce.pros}</span>
                    </div>
                    <div className="col-span-2">
                      <strong className="text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">Cons:</strong>
                      <span className="text-[var(--color-text-secondary)]">{activeProblem.bruteForce.cons}</span>
                    </div>
                  </div>

                  {activeProblem.bruteForce.code && (
                    <div className="mt-4 border-t border-[var(--color-border)]/40 pt-4">
                      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 select-none mb-3">
                        <span className="text-micro font-bold text-red-400 capitalize tracking-wider">{selectedLang} Brute Force</span>
                        <button
                          onClick={() => {
                            const codeToCopy = typeof activeProblem.bruteForce.code === "object"
                              ? activeProblem.bruteForce.code[selectedLang] || activeProblem.bruteForce.code.python || ""
                              : activeProblem.bruteForce.code;
                            handleCopyCode(codeToCopy, `brute-${selectedLang}`);
                          }}
                          className="flex items-center gap-1.5 text-caption text-zinc-500 hover:text-zinc-300 font-semibold cursor-pointer"
                        >
                          {copiedSection === `brute-${selectedLang}` ? <Check className="h-4 w-4 text-emerald-400" /> : null}
                          <span>{copiedSection === `brute-${selectedLang}` ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="overflow-x-auto bg-[var(--color-canvas)] border border-[var(--color-border)] p-4.5 rounded-xl font-mono text-caption text-[var(--color-text-primary)] select-text leading-relaxed">
                        {typeof activeProblem.bruteForce.code === "object"
                          ? activeProblem.bruteForce.code[selectedLang] || activeProblem.bruteForce.code.python || "// Code not compiled for this language."
                          : activeProblem.bruteForce.code}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </AccordionSection>

            {/* 5. Better Approach */}
            <AccordionSection title="Better Approach" sectionKey="better">
              {activeProblem.betterApproach && (
                <div className="space-y-3">
                  <p className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">{activeProblem.betterApproach.idea}</p>
                  <p className="text-caption font-mono text-[var(--color-text-tertiary)] mb-2">Complexity: {activeProblem.betterApproach.complexity}</p>

                  {activeProblem.betterApproach.code && (
                    <div className="mt-4 border-t border-[var(--color-border)]/40 pt-4">
                      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 select-none mb-3">
                        <span className="text-micro font-bold text-amber-400 capitalize tracking-wider">{selectedLang} Better Approach</span>
                        <button
                          onClick={() => {
                            const codeToCopy = typeof activeProblem.betterApproach.code === "object"
                              ? activeProblem.betterApproach.code[selectedLang] || activeProblem.betterApproach.code.python || ""
                              : activeProblem.betterApproach.code;
                            handleCopyCode(codeToCopy, `better-${selectedLang}`);
                          }}
                          className="flex items-center gap-1.5 text-caption text-zinc-500 hover:text-zinc-300 font-semibold cursor-pointer"
                        >
                          {copiedSection === `better-${selectedLang}` ? <Check className="h-4 w-4 text-emerald-400" /> : null}
                          <span>{copiedSection === `better-${selectedLang}` ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="overflow-x-auto bg-[var(--color-canvas)] border border-[var(--color-border)] p-4.5 rounded-xl font-mono text-caption text-[var(--color-text-primary)] select-text leading-relaxed">
                        {typeof activeProblem.betterApproach.code === "object"
                          ? activeProblem.betterApproach.code[selectedLang] || activeProblem.betterApproach.code.python || "// Code not compiled for this language."
                          : activeProblem.betterApproach.code}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </AccordionSection>

            {/* 6. Optimal Approach ⭐ */}
            <AccordionSection title="Optimal Approach ⭐" sectionKey="optimal">
              {activeProblem.optimalApproach && (
                <div className="space-y-4">
                  <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] p-4 rounded-xl mb-3">
                    <strong className="text-[11px] text-sky-400 block mb-1.5 uppercase tracking-wider font-bold">Interviewer Discussion:</strong>
                    <p className="text-[var(--color-text-secondary)] text-[13.5px] leading-relaxed">{activeProblem.optimalApproach.thinkingProcess}</p>
                  </div>
                  <div>
                    <strong className="text-[var(--color-text-secondary)] font-bold block mb-1 text-[14px]">Pattern Recognition:</strong>
                    <p className="text-[13.5px] text-[var(--color-text-secondary)] leading-relaxed">{activeProblem.optimalApproach.patternRec}</p>
                  </div>
                  <div>
                    <strong className="text-[var(--color-text-secondary)] font-bold block mb-1 text-[14px]">Common Mistakes:</strong>
                    <p className="text-red-400/90 text-[13.5px] leading-relaxed">{activeProblem.optimalApproach.mistakes}</p>
                  </div>
                </div>
              )}
            </AccordionSection>

            {/* 7. Dry Run */}
            <AccordionSection title="Dry Run" sectionKey="dryrun">
              <div className="space-y-4">
                <div className="overflow-x-auto border border-[var(--color-border)] rounded-xl bg-[var(--color-canvas)]">
                  <table className="w-full text-left text-caption font-mono">
                    <thead>
                      <tr className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] select-none">
                        <th className="p-3">Step</th>
                        <th className="p-3">Pointer Status</th>
                        <th className="p-3">Values Checked</th>
                        <th className="p-3">Action Details</th>
                        <th className="p-3">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProblem.dryRun?.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-[var(--color-border-subtle)] transition-colors ${
                            idx === dryRunStep ? "bg-emerald-500/10 text-emerald-400 font-bold" : "text-[var(--color-text-secondary)]"
                          }`}
                        >
                          <td className="p-3">{row.step}</td>
                          <td className="p-3">{row.ptr !== undefined ? row.ptr : row.left !== undefined ? `L:${row.left} R:${row.right}` : "-"}</td>
                          <td className="p-3">{row.val !== undefined ? row.val : row.sum !== undefined ? `Sum:${row.sum}` : "-"}</td>
                          <td className="p-3">{row.action}</td>
                          <td className="p-3">{row.decision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Dry Run Controls */}
                <div className="flex items-center justify-between bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-4 py-3 rounded-xl select-none">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setDryRunStep((prev) => Math.max(0, prev - 1))}
                      disabled={dryRunStep <= 0}
                      className="px-3.5 py-1.5 text-caption border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer"
                    >
                      Prev Step
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-4 py-1.5 text-caption font-bold bg-[var(--color-accent)] text-black rounded-lg hover:bg-[var(--color-accent-hover)] flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_10px_rgba(34,197,94,0.15)]"
                    >
                      {isPlaying ? <Pause className="h-4 w-4 fill-black text-black" /> : <Play className="h-4 w-4 fill-black text-black" />}
                      <span>{isPlaying ? "Pause" : "Play Animation"}</span>
                    </button>
                    <button
                      onClick={() => setDryRunStep((prev) => Math.min((activeProblem.dryRun?.length || 1) - 1, prev + 1))}
                      disabled={dryRunStep >= (activeProblem.dryRun?.length || 1) - 1}
                      className="px-3.5 py-1.5 text-caption border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer"
                    >
                      Next Step
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setDryRunStep(0);
                      setIsPlaying(false);
                    }}
                    className="flex items-center gap-1.5 text-caption text-zinc-500 hover:text-zinc-300 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Timeline</span>
                  </button>
                </div>
              </div>
            </AccordionSection>

            {/* 8. Visualization */}
            <AccordionSection title="Visualization" sectionKey="visual">
              <div className="space-y-4">
                {renderVisualExplanation()}
                <p className="text-micro text-zinc-500 font-sans italic text-center select-none">
                  SVG Pointer updates dynamically when moving through the timeline controls of the Dry Run tab above.
                </p>
              </div>
            </AccordionSection>

            {/* 9. Complexity */}
            <AccordionSection title="Complexity" sectionKey="complexity">
              <div className="space-y-5">
                <div className="overflow-x-auto border border-[var(--color-border)] rounded-xl bg-[var(--color-canvas)]">
                  <table className="w-full text-left text-caption font-sans">
                    <thead>
                      <tr className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] select-none">
                        <th className="p-3">Approach</th>
                        <th className="p-3">Time Complexity</th>
                        <th className="p-3">Space Complexity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProblem.complexityTable?.map((row, idx) => (
                        <tr key={idx} className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                          <td className="p-3 font-semibold text-[var(--color-text-primary)]">{row.approach}</td>
                          <td className="p-3 font-mono text-emerald-400">{row.time}</td>
                          <td className="p-3 font-mono text-sky-400">{row.space}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Animated Recharts curve */}
                <div className="h-[230px] w-full border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface-raised)] select-none">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Complexity Big-O Curves</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateComplexityChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                      <XAxis dataKey="name" stroke="#66676f" fontSize={10} />
                      <YAxis stroke="#66676f" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }} />
                      <Legend fontSize={10} wrapperStyle={{ fontSize: "10px" }} />
                      <Line type="monotone" dataKey="Brute Force (N^2)" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Optimal (N)" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="Binary Search (log N)" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </AccordionSection>

            {/* 10. Interview Tips */}
            {activeProblem.interviewTips && (
              <AccordionSection title="Interview Tips" sectionKey="tips">
                <div className="space-y-4">
                  <div>
                    <strong className="text-[var(--color-text-secondary)] block mb-1 text-[14px]">Common Mistakes:</strong>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">{activeProblem.interviewTips.mistakes}</p>
                  </div>
                  <div>
                    <strong className="text-[var(--color-text-secondary)] block mb-1 text-[14px]">Optimization Hints:</strong>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">{activeProblem.interviewTips.optimization}</p>
                  </div>
                  <div>
                    <strong className="text-[var(--color-text-secondary)] block mb-1 text-[14px]">Follow-up Questions:</strong>
                    <p className="text-sky-400/90 font-mono text-[12px] leading-relaxed">{activeProblem.interviewTips.followups}</p>
                  </div>
                </div>
              </AccordionSection>
            )}

            {/* Code Tabs Section */}
            {activeProblem.optimalApproach?.code && (
              <AccordionSection title="Optimal Solution Code Tab" sectionKey="code">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 select-none">
                    <span className="text-micro font-bold text-emerald-400 capitalize tracking-wider">{selectedLang} Solution</span>
                    <button
                      onClick={() => handleCopyCode(activeProblem.optimalApproach.code[selectedLang] || "", selectedLang)}
                      className="flex items-center gap-1.5 text-caption text-zinc-500 hover:text-zinc-300 font-semibold cursor-pointer"
                    >
                      {copiedSection === selectedLang ? <Check className="h-4 w-4 text-emerald-400" /> : null}
                      <span>{copiedSection === selectedLang ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto bg-[var(--color-canvas)] border border-[var(--color-border)] p-4.5 rounded-xl font-mono text-caption text-[var(--color-text-primary)] select-text leading-relaxed">
                    {activeProblem.optimalApproach.code[selectedLang] || "// Code solution not compiled for this language."}
                  </pre>
                </div>
              </AccordionSection>
            )}

          </div>
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-3 text-[var(--color-text-secondary)] select-none">
          <Brain className="h-14 w-14 text-[var(--color-accent)] animate-pulse" />
          <h3 className="text-body font-bold text-[var(--color-text-primary)]">Tutor Active & Standby</h3>
          <p className="max-w-md text-caption text-zinc-500">
            Please search for a DSA problem (like "Two Sum") or paste a LeetCode URL to load the tutor modules.
          </p>
        </div>
      )}
    </div>
  );
}
