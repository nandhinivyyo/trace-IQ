import React, { useState } from "react";
import { usePlayback } from "@/services/playback-store";
import { VariableInspector } from "./variable-inspector";
import { DiffEngine } from "./diff-engine";
import {
  Cpu,
  GitCompare,
  Camera,
  FolderHeart,
  Terminal,
  Plus,
  Trash2,
  Download,
  Database,
} from "lucide-react";
import { exportSessionJson } from "@/services/export-manager";

export function ExecutionTimeline() {
  const {
    traces,
    currentStepIdx,
    snapshots,
    saveSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    sessions,
    saveCurrentSession,
    loadSession,
    deleteSession,
    activeSessionId,
    consoleLogs,
  } = usePlayback();

  const [activeTab, setActiveTab] = useState("scope");
  const [newSnapName, setNewSnapName] = useState("");
  const [newSessionName, setNewSessionName] = useState("");

  const currentStep = traces[currentStepIdx] || null;

  // Handle snapshot creation
  const handleSaveSnapshot = (e) => {
    e.preventDefault();
    if (!newSnapName.trim()) return;
    saveSnapshot(newSnapName.trim());
    setNewSnapName("");
  };

  // Handle session creation
  const handleSaveSession = (e) => {
    e.preventDefault();
    saveCurrentSession(newSessionName.trim() || undefined);
    setNewSessionName("");
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] text-[var(--color-text-secondary)] select-none border border-[#232323] rounded-[var(--radius-sm)] overflow-hidden">
      {/* 1. Header Tab Switcher */}
      <div className="flex border-b border-[#232323] bg-[#161616]/60 p-1 gap-0.5 shrink-0">
        <button
          onClick={() => setActiveTab("scope")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "scope"
              ? "bg-[#22C55E] text-black shadow-[0_0_8px_rgba(34,197,94,0.15)]"
              : "text-zinc-300 hover:text-zinc-100"
          }`}
          title="Variables & Call Stack Scopes"
        >
          <Cpu className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Scope</span>
        </button>

        <button
          onClick={() => setActiveTab("diffs")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "diffs"
              ? "bg-[#22C55E] text-black shadow-[0_0_8px_rgba(34,197,94,0.15)]"
              : "text-zinc-300 hover:text-zinc-100"
          }`}
          title="Compare Steps Diff Studio"
        >
          <GitCompare className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Diffs</span>
        </button>

        <button
          onClick={() => setActiveTab("snapshots")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "snapshots"
              ? "bg-[#22C55E] text-black shadow-[0_0_8px_rgba(34,197,94,0.15)]"
              : "text-zinc-300 hover:text-zinc-100"
          }`}
          title="Save/Restore execution snapshots"
        >
          <Camera className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Snaps ({snapshots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "sessions"
              ? "bg-[#22C55E] text-black shadow-[0_0_8px_rgba(34,197,94,0.15)]"
              : "text-zinc-300 hover:text-zinc-100"
          }`}
          title="Sessions & History manager"
        >
          <FolderHeart className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab("console")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "console"
              ? "bg-[#22C55E] text-black shadow-[0_0_8px_rgba(34,197,94,0.15)]"
              : "text-zinc-300 hover:text-zinc-100"
          }`}
          title="Output Terminal Sandbox"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Console</span>
        </button>
      </div>

      {/* 2. Content Panels */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* SCOPE TAB */}
        {activeTab === "scope" && (
          <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto scrollbar-thin">
            <VariableInspector />

            {/* Stack and Heap Memory Frame summary */}
            {currentStep ? (
              <div className="flex flex-col gap-2.5 p-4 border border-[#232323] bg-[#0B0B0B] rounded-[var(--radius-sm)]">
                <div className="flex items-center gap-2 pb-1 border-b border-[#232323]">
                  <Database className="h-4 w-4 text-[#22C55E]" />
                  <h3 className="text-caption font-bold text-[var(--color-text-primary)]">
                    Virtual Memory Allocations
                  </h3>
                </div>

                {/* Call Stack frames */}
                <div className="flex flex-col gap-1.5 font-mono text-micro select-text">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">
                    Stack Memory Frames
                  </span>
                  <div className="flex flex-col gap-1 bg-[#111] p-2 rounded border border-[#232323]">
                    {currentStep.functionStack &&
                    currentStep.functionStack.length > 0 ? (
                      currentStep.functionStack.map((frame, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex justify-between items-center py-0.5 border-b border-zinc-900 last:border-0"
                        >
                          <span className="text-[#22C55E]">
                            [{frame.callDepth}] {frame.currentFunction}
                          </span>
                          <span className="text-zinc-600 text-[10px]">
                            parent: {frame.parentFunction}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-zinc-700 italic">
                        Global frame allocation
                      </span>
                    )}
                  </div>
                </div>

                {/* Heap Memory References */}
                <div className="flex flex-col gap-1.5 font-mono text-micro select-text mt-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">
                    Heap Object References
                  </span>
                  <div className="flex flex-col gap-1 bg-[#111] p-2 rounded border border-[#232323]">
                    {currentStep.variablesAfter?.some(
                      (v) =>
                        v.referenceType &&
                        v.memoryAddress !== "0x0" &&
                        v.memoryAddress !== "null",
                    ) ? (
                      currentStep.variablesAfter
                        .filter(
                          (v) =>
                            v.referenceType &&
                            v.memoryAddress !== "0x0" &&
                            v.memoryAddress !== "null",
                        )
                        .map((v, vIdx) => (
                          <div
                            key={vIdx}
                            className="flex justify-between items-center py-0.5 border-b border-zinc-900 last:border-0"
                          >
                            <span className="text-blue-400 font-bold">
                              {v.name}
                            </span>
                            <span className="text-zinc-500 font-bold bg-[#161616] border border-[#232323] px-1 rounded text-[9px]">
                              {v.memoryAddress}
                            </span>
                          </div>
                        ))
                    ) : (
                      <span className="text-zinc-700 italic">
                        No object allocations in heap
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-micro text-zinc-600 italic py-4 text-center">
                No active memory stack states loaded.
              </div>
            )}
          </div>
        )}

        {/* DIFFS TAB */}
        {activeTab === "diffs" && (
          <div className="h-full">
            <DiffEngine />
          </div>
        )}

        {/* SNAPSHOTS TAB */}
        {activeTab === "snapshots" && (
          <div className="flex flex-col gap-3 p-3 min-h-0">
            <form onSubmit={handleSaveSnapshot} className="flex gap-2">
              <input
                type="text"
                placeholder="Save step snapshot as..."
                value={newSnapName}
                onChange={(e) => setNewSnapName(e.target.value)}
                className="flex-1 h-8 bg-[#0B0B0B] border border-[#232323] rounded px-2.5 text-micro text-zinc-300 focus:outline-none focus:border-[#22C55E] placeholder-zinc-700"
              />

              <button
                type="submit"
                className="h-8 w-8 rounded bg-[#22C55E] hover:bg-[#2fd66d] text-black font-bold flex items-center justify-center cursor-pointer transition-colors shadow shadow-[#22c55e]/15"
                title="Capture step snapshot"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 scrollbar-thin">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  onClick={() => restoreSnapshot(snap.id)}
                  className="flex items-center justify-between p-2.5 rounded border border-[#232323] bg-[#0B0B0B] hover:border-zinc-700 cursor-pointer group transition-all"
                >
                  <div className="flex flex-col font-mono text-micro select-text">
                    <strong className="text-zinc-300 truncate max-w-[180px]">
                      {snap.name}
                    </strong>
                    <span className="text-[9px] text-zinc-500 mt-0.5">
                      Step {snap.stepIdx + 1} ({snap.timestamp})
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSnapshot(snap.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-500 transition-opacity cursor-pointer"
                    title="Delete Snapshot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {snapshots.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro select-none">
                  <Camera className="h-7 w-7 mb-2 stroke-[1.5] text-[#22C55E] opacity-40 animate-pulse" />
                  <span>No saved snapshots.</span>
                  <p className="text-[10px] mt-1 text-zinc-700 max-w-[200px]">
                    Create snapshots of program variables during stepping to
                    jump back quickly.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === "sessions" && (
          <div className="flex flex-col gap-3 p-3 min-h-0">
            <form onSubmit={handleSaveSession} className="flex gap-2">
              <input
                type="text"
                placeholder="Save current session as..."
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="flex-1 h-8 bg-[#0B0B0B] border border-[#232323] rounded px-2.5 text-micro text-zinc-300 focus:outline-none focus:border-[#22C55E] placeholder-zinc-700"
              />

              <button
                type="submit"
                className="h-8 w-8 rounded bg-[#22C55E] hover:bg-[#2fd66d] text-black font-bold flex items-center justify-center cursor-pointer transition-colors shadow shadow-[#22c55e]/15"
                title="Save Session History"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 scrollbar-thin">
              {sessions.map((sess) => {
                const isActive = activeSessionId === sess.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => loadSession(sess.id)}
                    className={`flex items-center justify-between p-2.5 rounded border cursor-pointer group transition-all ${
                      isActive
                        ? "bg-[#12321f]/20 border-[#22c55e]"
                        : "bg-[#0B0B0B] border-[#232323] hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex flex-col font-mono text-micro select-text">
                      <strong
                        className={
                          isActive
                            ? "text-[#22C55E] font-bold"
                            : "text-zinc-300"
                        }
                      >
                        {sess.name}
                      </strong>
                      <span className="text-[9px] text-zinc-500 mt-0.5">
                        {sess.traces.length} steps · {sess.language} (
                        {sess.timestamp})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSessionJson(sess);
                        }}
                        className="p-1 text-zinc-500 hover:text-blue-400 cursor-pointer"
                        title="Export Session JSON"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(sess.id);
                        }}
                        className="p-1 text-zinc-500 hover:text-red-500 cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-micro select-none">
                  <FolderHeart className="h-7 w-7 mb-2 stroke-[1.5] text-[#22C55E] opacity-40 animate-pulse" />
                  <span>No saved sessions.</span>
                  <p className="text-[10px] mt-1 text-zinc-700 max-w-[200px]">
                    Save your trace sessions to history to load past codes and
                    snapshots later.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONSOLE TAB */}
        {activeTab === "console" && (
          <div className="flex flex-col h-full p-3 font-mono text-micro">
            <div className="flex items-center justify-between border-b border-[#232323] pb-1.5 mb-2 font-sans font-bold text-zinc-500">
              <span>Sandbox Logs</span>
              <span className="text-[9px] uppercase tracking-wider bg-zinc-800 text-zinc-300 px-1 rounded">
                stdout
              </span>
            </div>

            <div className="flex-1 bg-[#0b0b0b] border border-[#232323] p-2.5 rounded max-h-[400px] overflow-y-auto whitespace-pre-wrap select-text scrollbar-thin">
              {consoleLogs && consoleLogs.length > 0 ? (
                <div className="space-y-1">
                  {consoleLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.startsWith("[Execution] Success") ||
                        log.startsWith(
                          "[Compiler] Syntax compilation check passed",
                        )
                          ? "text-[#22c55e] font-bold"
                          : log.startsWith("[Execution] Failed") ||
                              log.startsWith("[stderr]") ||
                              log.startsWith(
                                "[Compiler] Syntax compilation check failed",
                              )
                            ? "text-red-500"
                            : "text-zinc-400"
                      }
                    >
                      {log}
                    </div>
                  ))}
                  {currentStep && currentStep.currentConsoleOutput && (
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 mt-3 pt-2 border-t border-zinc-900 font-sans font-bold">
                      Execution stdout output:
                    </div>
                  )}
                  {currentStep && currentStep.currentConsoleOutput && (
                    <div className="text-zinc-300 leading-relaxed font-mono mt-1">
                      {currentStep.currentConsoleOutput}
                    </div>
                  )}
                </div>
              ) : currentStep && currentStep.currentConsoleOutput ? (
                <div className="text-zinc-300 leading-relaxed font-mono">
                  {currentStep.currentConsoleOutput}
                </div>
              ) : (
                <div className="text-zinc-700 italic select-none">
                  No console outputs at this step.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
