import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Flame,
  History,
  Heart,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Layers,
  BookOpen
} from "lucide-react";

export function DsaSidebar({
  activeProblemId,
  onSelectProblem,
  history = [],
  favorites = [],
  activeCategory,
  onSelectCategory,
  problemsList = [],
  streak = 5,
  onCollapse
}) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { id: "Arrays", label: "Arrays" },
    { id: "Strings", label: "Strings" },
    { id: "Two Pointers", label: "Two Pointers" },
    { id: "Sliding Window", label: "Sliding Window" },
    { id: "Binary Search", label: "Binary Search" },
    { id: "Trees", label: "Trees" },
    { id: "Graphs", label: "Graphs" },
    { id: "DP", label: "Dynamic Programming" },
    { id: "Greedy", label: "Greedy" },
    { id: "Stack", label: "Stack" },
    { id: "Queue", label: "Queue" },
    { id: "Heap", label: "Heap" },
    { id: "Backtracking", label: "Backtracking" }
  ];

  // Helper to get problems matching search & category mapping
  const getProblemsForCategory = (catId) => {
    return problemsList.filter((p) => {
      // Normalize category naming differences
      let mappedCat = p.category || "";
      if (mappedCat === "Arrays & Hashing") mappedCat = "Arrays";
      if (mappedCat === "Dynamic Programming") mappedCat = "DP";

      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = catId === "all" || mappedCat === catId;
      return matchesSearch && matchesCategory;
    });
  };

  return (
    <div className="w-[300px] shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex flex-col h-full overflow-hidden select-none">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
          <span className="text-body font-bold text-[var(--color-text-primary)] tracking-tight">DSA Learning Catalog</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Flame Streak */}
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-full text-micro font-bold text-orange-500 hover:scale-105 transition-transform">
            <Flame className="h-3 w-3 fill-orange-500" />
            <span>{streak} Days</span>
          </div>

          {/* Collapse trigger */}
          <button
            onClick={onCollapse}
            className="p-1 hover:bg-[var(--color-surface-elevated)] rounded-md text-zinc-500 hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Large Search Bar */}
      <div className="p-4 border-b border-[var(--color-border-subtle)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search Local Catalog..."
            className="w-full bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-md py-2.5 pl-9 pr-3 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-subtle-border)] transition-colors placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Main scrolling items panel */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        
        {/* Categories section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-micro font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <Layers className="h-3.5 w-3.5 text-zinc-500" />
            <span>Categories</span>
          </div>

          <div className="flex flex-col gap-1 pr-1">
            {categories.map((cat) => {
              const isExpanded = activeCategory === cat.id;
              const catProblems = getProblemsForCategory(cat.id);

              return (
                <div key={cat.id} className="flex flex-col">
                  {/* Category Trigger Button */}
                  <button
                    onClick={() => onSelectCategory(cat.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors text-left cursor-pointer ${
                      activeCategory === cat.id
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border-l-2 border-[var(--color-accent)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isExpanded ? "rotate-90 text-[var(--color-accent)]" : "text-zinc-500"
                      }`}
                    />
                  </button>

                  {/* Indented Dropdown List of Problems under this Category */}
                  <AnimatePresence initial={false}>
                    {isExpanded && catProblems.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="pl-4 pr-1 py-1 flex flex-col gap-1 overflow-hidden"
                      >
                        {catProblems.map((prob) => {
                          const isActive = activeProblemId === prob.id;
                          return (
                            <button
                              key={prob.id}
                              onClick={() => onSelectProblem(prob.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-md text-[12px] transition-all text-left cursor-pointer ${
                                isActive
                                  ? "bg-[var(--color-surface-elevated)] border-l-2 border-[var(--color-accent)] text-[var(--color-text-primary)] font-bold shadow-sm"
                                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
                              }`}
                            >
                              <span className="truncate pr-2">{prob.title}</span>
                              <span
                                className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 select-none ${
                                  prob.difficulty === "Easy"
                                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                    : prob.difficulty === "Medium"
                                    ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                                    : "bg-red-500/10 border-red-500/25 text-red-400"
                                }`}
                              >
                                {prob.difficulty}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saved section */}
        <div className="space-y-2 pt-2 border-t border-[var(--color-border-subtle)]/40">
          <div className="flex items-center gap-2 px-1 text-micro font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            <span>Saved Problems</span>
          </div>
          {favorites.length === 0 ? (
            <span className="px-2 text-micro text-zinc-600 block italic">No saved items.</span>
          ) : (
            <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto scrollbar-thin">
              {favorites.map((favId) => {
                const prob = problemsList.find((p) => p.id === favId);
                if (!prob) return null;
                return (
                  <button
                    key={favId}
                    onClick={() => onSelectProblem(favId)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] rounded transition-colors text-left cursor-pointer"
                  >
                    <span className="truncate flex-1">{prob.title}</span>
                    <Bookmark className="h-3 w-3 text-amber-400 fill-amber-400" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* History section */}
        <div className="space-y-2 pt-2 border-t border-[var(--color-border-subtle)]/40">
          <div className="flex items-center gap-2 px-1 text-micro font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <History className="h-3.5 w-3.5 text-zinc-500" />
            <span>Learning History</span>
          </div>
          {history.length === 0 ? (
            <span className="px-2 text-micro text-zinc-600 block italic">No history yet.</span>
          ) : (
            <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto scrollbar-thin">
              {history.map((histItem, idx) => {
                const prob = problemsList.find((p) => p.id === histItem.problemId);
                const title = prob ? prob.title : histItem.problemName;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectProblem(histItem.problemId || "two-sum")}
                    className="w-full flex flex-col px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] rounded transition-colors text-left cursor-pointer"
                  >
                    <span className="truncate">{title}</span>
                    <span className="text-[10px] text-zinc-600 font-mono mt-0.5">{histItem.timestamp}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
