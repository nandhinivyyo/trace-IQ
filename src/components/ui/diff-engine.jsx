import { useState, useMemo } from "react";
import { usePlayback } from "@/services/playback-store";
import { parseArrayValue } from "@/services/renderer-utils";
import {
  GitCompare,
  ArrowRight,
  Terminal,
  Layers,
  Database,
  Grid,
  Network,
} from "lucide-react";

export function DiffEngine() {
  const {
    traces,
    compareStepA,
    setCompareStepA,
    compareStepB,
    setCompareStepB,
  } = usePlayback();

  const [diffTab, setDiffTab] = useState("variables");

  // Reset steps option helper
  const stepsOptions = useMemo(() => {
    return traces.map((_, i) => ({
      value: i,
      label: `Step ${i + 1} (${traces[i].currentFunction})`,
    }));
  }, [traces]);

  // Diff Calculations
  const diffData = useMemo(() => {
    if (compareStepA === null || compareStepB === null) return null;
    const stepA = traces[compareStepA];
    const stepB = traces[compareStepB];
    if (!stepA || !stepB) return null;

    const varsA = stepA.variablesAfter || [];
    const varsB = stepB.variablesAfter || [];

    // 1. Variables Diff
    const varDiffs = [];
    varsA.forEach((vA) => {
      const vB = varsB.find((v) => v.name === vA.name);
      if (!vB) {
        varDiffs.push({
          name: vA.name,
          type: vA.datatype,
          valA: String(vA.value),
          valB: "",
          scope: vA.scope,
          status: "deleted",
        });
      } else if (String(vA.value) !== String(vB.value)) {
        varDiffs.push({
          name: vA.name,
          type: vA.datatype,
          valA: String(vA.value),
          valB: String(vB.value),
          scope: vA.scope,
          status: "modified",
        });
      }
    });
    varsB.forEach((vB) => {
      const vA = varsA.find((v) => v.name === vB.name);
      if (!vA) {
        varDiffs.push({
          name: vB.name,
          type: vB.datatype,
          valA: "",
          valB: String(vB.value),
          scope: vB.scope,
          status: "added",
        });
      }
    });

    // 2. Stack Frame Diff
    const stackA = stepA.functionStack || [];
    const stackB = stepB.functionStack || [];
    const stackDiffs = [];
    const maxLen = Math.max(stackA.length, stackB.length);
    for (let i = 0; i < maxLen; i++) {
      const frameA = stackA[i];
      const frameB = stackB[i];
      if (frameA && !frameB) {
        stackDiffs.push({
          name: frameA.currentFunction,
          depth: frameA.callDepth,
          action: "popped",
        });
      } else if (!frameA && frameB) {
        stackDiffs.push({
          name: frameB.currentFunction,
          depth: frameB.callDepth,
          action: "pushed",
        });
      } else if (frameA && frameB) {
        if (frameA.currentFunction !== frameB.currentFunction) {
          stackDiffs.push({
            name: `${frameA.currentFunction} ➔ ${frameB.currentFunction}`,
            depth: frameB.callDepth,
            action: "pushed",
          });
        } else {
          stackDiffs.push({
            name: frameA.currentFunction,
            depth: frameA.callDepth,
            action: "unchanged",
          });
        }
      }
    }

    // 3. Console logs Diff
    const logA = stepA.currentConsoleOutput || "";
    const logB = stepB.currentConsoleOutput || "";

    // 4. Array Diff
    const arrayDiffs = [];
    const arraysA = varsA.filter(
      (v) =>
        v.datatype.includes("[]") ||
        v.datatype.includes("list") ||
        (v.value.trim().startsWith("[") && v.value.trim().endsWith("]")),
    );
    const arraysB = varsB.filter(
      (v) =>
        v.datatype.includes("[]") ||
        v.datatype.includes("list") ||
        (v.value.trim().startsWith("[") && v.value.trim().endsWith("]")),
    );

    arraysB.forEach((arrB) => {
      const arrA = arraysA.find((a) => a.name === arrB.name);
      const parsedB = parseArrayValue(arrB.value) || [];
      const parsedA = arrA ? parseArrayValue(arrA.value) || [] : [];
      const elements = [];
      const size = Math.max(parsedA.length, parsedB.length);
      for (let idx = 0; idx < size; idx++) {
        const valA = parsedA[idx];
        const valB = parsedB[idx];
        if (valA === undefined && valB !== undefined) {
          elements.push({ index: idx, valA: null, valB, status: "added" });
        } else if (valA !== undefined && valB === undefined) {
          elements.push({ index: idx, valA, valB: null, status: "deleted" });
        } else if (valA !== valB) {
          elements.push({ index: idx, valA, valB, status: "modified" });
        } else {
          elements.push({ index: idx, valA, valB, status: "same" });
        }
      }
      arrayDiffs.push({ varName: arrB.name, elements });
    });

    // 5. Structure (DSA Graph/Tree) Diff Parser
    const dsaDiffs = [];

    // LinkedList / Tree detect
    const detectDsaType = (v) => {
      if (
        v.datatype.toLowerCase().includes("tree") ||
        v.value.includes("left") ||
        v.value.includes("right")
      )
        return "tree";
      if (v.datatype.toLowerCase().includes("list") || v.value.includes("next"))
        return "linkedlist";
      if (v.datatype.toLowerCase().includes("stack")) return "stack";
      if (
        v.datatype.toLowerCase().includes("queue") ||
        v.datatype.toLowerCase().includes("q")
      )
        return "queue";
      if (
        v.datatype.toLowerCase().includes("map") ||
        v.datatype.toLowerCase().includes("dict") ||
        v.value.startsWith("{")
      )
        return "hashmap";
      if (v.datatype.toLowerCase().includes("graph") || v.name.includes("adj"))
        return "graph";
      return "unknown";
    };

    varsB.forEach((vB) => {
      const type = detectDsaType(vB);
      if (type === "unknown") return;
      const vA = varsA.find((v) => v.name === vB.name);
      const diffsList = [];

      try {
        if (type === "hashmap") {
          const mapB = JSON.parse(vB.value.replace(/'/g, '"'));
          const mapA = vA ? JSON.parse(vA.value.replace(/'/g, '"')) : {};
          Object.keys(mapB).forEach((key) => {
            const valB = String(mapB[key]);
            const valA =
              mapA[key] !== undefined ? String(mapA[key]) : undefined;
            if (valA === undefined) {
              diffsList.push({ nodeKey: key, valA: "", valB, status: "added" });
            } else if (valA !== valB) {
              diffsList.push({ nodeKey: key, valA, valB, status: "modified" });
            }
          });
          Object.keys(mapA).forEach((key) => {
            if (mapB[key] === undefined) {
              diffsList.push({
                nodeKey: key,
                valA: String(mapA[key]),
                valB: "",
                status: "deleted",
              });
            }
          });
        } else if (type === "tree" || type === "linkedlist") {
          const objB = JSON.parse(vB.value.replace(/'/g, '"'));
          const objA = vA ? JSON.parse(vA.value.replace(/'/g, '"')) : null;

          // Flat list nodes or values comparison
          Object.keys(objB).forEach((key) => {
            const valB = String(objB[key]);
            const valA = objA ? String(objA[key]) : undefined;
            if (valA === undefined) {
              diffsList.push({ nodeKey: key, valA: "", valB, status: "added" });
            } else if (valA !== valB) {
              diffsList.push({ nodeKey: key, valA, valB, status: "modified" });
            }
          });
        }
      } catch (e) {}

      dsaDiffs.push({
        varName: vB.name,
        type,
        diffs: diffsList,
      });
    });

    return {
      stepANum: compareStepA + 1,
      stepBNum: compareStepB + 1,
      varDiffs,
      stackDiffs,
      logA,
      logB,
      arrayDiffs,
      dsaDiffs,
    };
  }, [traces, compareStepA, compareStepB]);

  return (
    <div className="flex flex-col gap-4 p-4 border border-[#232323] bg-[#111111] rounded-[var(--radius-sm)] h-full overflow-hidden select-none">
      {/* 1. Header with GitCompare Symbol */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232323] shrink-0">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4.5 w-4.5 text-[#22C55E]" />
          <h3 className="text-caption font-semibold text-[var(--color-text-primary)]">
            Execution Diff Studio
          </h3>
        </div>
        <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold bg-[#161616] border border-[#232323] px-2 py-0.5 rounded">
          Step Comparison
        </span>
      </div>

      {/* 2. Step Selector Dropdowns */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
            Step A (Baseline)
          </span>
          <select
            value={compareStepA ?? ""}
            onChange={(e) =>
              setCompareStepA(e.target.value ? parseInt(e.target.value) : null)
            }
            className="h-8 border border-[#232323] bg-[#0B0B0B] rounded px-2 text-micro text-zinc-300 focus:outline-none cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <option value="">(Select Step)</option>
            {stepsOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
            Step B (Target)
          </span>
          <select
            value={compareStepB ?? ""}
            onChange={(e) =>
              setCompareStepB(e.target.value ? parseInt(e.target.value) : null)
            }
            className="h-8 border border-[#232323] bg-[#0B0B0B] rounded px-2 text-micro text-zinc-300 focus:outline-none cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <option value="">(Select Step)</option>
            {stepsOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {diffData ? (
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {/* 3. Diff Category Switcher Tabs */}
          <div className="flex border-b border-[#232323] gap-1 shrink-0 bg-[#0B0B0B]/50 p-0.5 rounded">
            <button
              onClick={() => setDiffTab("variables")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                diffTab === "variables"
                  ? "bg-[#22C55E] text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Vars</span>
            </button>

            <button
              onClick={() => setDiffTab("memory")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                diffTab === "memory"
                  ? "bg-[#22C55E] text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Database className="h-3 w-3" />
              <span>Memory</span>
            </button>

            <button
              onClick={() => setDiffTab("array")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                diffTab === "array"
                  ? "bg-[#22C55E] text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Grid className="h-3 w-3" />
              <span>Arrays</span>
            </button>

            <button
              onClick={() => setDiffTab("dsa")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                diffTab === "dsa"
                  ? "bg-[#22C55E] text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Network className="h-3 w-3" />
              <span>DSA</span>
            </button>

            <button
              onClick={() => setDiffTab("console")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                diffTab === "console"
                  ? "bg-[#22C55E] text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Terminal className="h-3 w-3" />
              <span>Console</span>
            </button>
          </div>

          {/* 4. Display Content Area */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin select-text font-mono text-micro leading-normal">
            {/* VARIABLES DIFF */}
            {diffTab === "variables" && (
              <div className="flex flex-col gap-2">
                {diffData.varDiffs.map((diff, i) => (
                  <div
                    key={i}
                    className={`p-2 border rounded flex flex-col gap-1.5 ${
                      diff.status === "added"
                        ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400"
                        : diff.status === "deleted"
                          ? "bg-red-950/20 border-red-900/50 text-red-400 line-through"
                          : "bg-[#0B0B0B] border-[#232323] text-zinc-300"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span>
                        {diff.name}{" "}
                        <span className="opacity-50 font-normal">
                          ({diff.type})
                        </span>
                      </span>
                      <span
                        className={`text-[8px] px-1 py-0.5 rounded font-mono font-bold uppercase ${
                          diff.status === "added"
                            ? "bg-emerald-900 text-emerald-300"
                            : diff.status === "deleted"
                              ? "bg-red-900 text-red-300"
                              : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {diff.status}
                      </span>
                    </div>

                    {diff.status === "modified" ? (
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 font-semibold">
                        <span className="line-through text-red-500 font-mono bg-red-950/30 px-1 border border-red-900/30 rounded">
                          {diff.valA}
                        </span>
                        <ArrowRight className="h-3 w-3 text-zinc-600" />
                        <span className="text-emerald-400 font-mono bg-emerald-950/30 px-1 border border-emerald-900/30 rounded">
                          {diff.valB}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-0.5 break-all text-caption font-semibold">
                        Value: {diff.status === "added" ? diff.valB : diff.valA}
                      </div>
                    )}
                  </div>
                ))}
                {diffData.varDiffs.length === 0 && (
                  <div className="text-zinc-600 italic text-center py-4">
                    No variable states changed between steps.
                  </div>
                )}
              </div>
            )}

            {/* MEMORY STACK FRAMES DIFF */}
            {diffTab === "memory" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 bg-[#0B0B0B] border border-[#232323] p-2.5 rounded">
                  <h4 className="text-[10px] text-zinc-500 font-sans font-bold uppercase tracking-wider border-b border-[#232323] pb-1.5 mb-2">
                    Stack Frame Diff
                  </h4>

                  <div className="flex flex-col gap-1.5">
                    {diffData.stackDiffs.map((frame, i) => (
                      <div
                        key={i}
                        className={`flex justify-between items-center py-1 px-2 rounded border text-micro font-bold ${
                          frame.action === "pushed"
                            ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                            : frame.action === "popped"
                              ? "bg-red-950/20 border-red-900/40 text-red-400 line-through"
                              : "bg-zinc-900/40 border-zinc-900 text-zinc-500"
                        }`}
                      >
                        <span>
                          Depth [{frame.depth}]: {frame.name}
                        </span>
                        <span className="text-[9px] uppercase font-mono">
                          {frame.action}
                        </span>
                      </div>
                    ))}
                    {diffData.stackDiffs.length === 0 && (
                      <div className="text-zinc-700 italic py-1 text-center">
                        Global Stack remains unmodified.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ARRAY CELL-BY-CELL DIFF */}
            {diffTab === "array" && (
              <div className="flex flex-col gap-4">
                {diffData.arrayDiffs.map((arr, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 border border-[#232323] bg-[#0B0B0B] p-3 rounded"
                  >
                    <div className="flex justify-between items-center border-b border-[#232323] pb-1.5 mb-1.5 font-bold text-zinc-400">
                      <span>Array: {arr.varName}</span>
                      <span className="text-[9px] text-zinc-600">
                        {arr.elements.length} elements
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {arr.elements.map((el, j) => {
                        const styleClass =
                          el.status === "added"
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-400 font-bold"
                            : el.status === "deleted"
                              ? "bg-red-950/40 border-red-500 text-red-400 line-through opacity-50"
                              : el.status === "modified"
                                ? "bg-amber-950/40 border-amber-500 text-amber-400 font-bold"
                                : "bg-[#161616] border-[#232323] text-zinc-500";

                        return (
                          <div
                            key={j}
                            className={`flex flex-col items-center justify-center min-w-[36px] h-10 rounded border font-mono ${styleClass}`}
                            title={`Index ${el.index}: ${el.status}`}
                          >
                            <span className="text-[8px] text-zinc-600 border-b border-zinc-900/20 w-full text-center">
                              {el.index}
                            </span>
                            <span className="text-[10px] py-0.5">
                              {el.status === "modified"
                                ? `${el.valA}➔${el.valB}`
                                : el.status === "added"
                                  ? el.valB
                                  : el.valA}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {diffData.arrayDiffs.length === 0 && (
                  <div className="text-zinc-600 italic text-center py-4">
                    No active arrays in baseline/target traces.
                  </div>
                )}
              </div>
            )}

            {/* DATA STRUCTURE NODES DIFF */}
            {diffTab === "dsa" && (
              <div className="flex flex-col gap-3">
                {diffData.dsaDiffs.map((dsa, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 border border-[#232323] bg-[#0B0B0B] p-3 rounded"
                  >
                    <div className="flex justify-between items-center border-b border-[#232323] pb-1.5 mb-1.5 font-bold text-zinc-400">
                      <span>DSA variable: {dsa.varName}</span>
                      <span className="text-[9px] uppercase text-[#22C55E] bg-[#12321f] px-1 rounded">
                        {dsa.type}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {dsa.diffs.map((diff, j) => (
                        <div
                          key={j}
                          className={`flex items-center justify-between p-2 rounded border ${
                            diff.status === "added"
                              ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400"
                              : diff.status === "deleted"
                                ? "bg-red-950/20 border-red-900/50 text-red-400 line-through"
                                : "bg-zinc-900/40 border-zinc-900 text-zinc-300"
                          }`}
                        >
                          <span className="font-bold">Key: {diff.nodeKey}</span>
                          {diff.status === "modified" ? (
                            <span className="flex items-center gap-1.5">
                              <span className="line-through text-red-500">
                                {diff.valA}
                              </span>
                              <ArrowRight className="h-3 w-3 text-zinc-600" />
                              <strong className="text-emerald-400">
                                {diff.valB}
                              </strong>
                            </span>
                          ) : (
                            <span>
                              Value:{" "}
                              {diff.status === "added" ? diff.valB : diff.valA}
                            </span>
                          )}
                        </div>
                      ))}
                      {dsa.diffs.length === 0 && (
                        <div className="text-zinc-700 italic py-1 text-center">
                          No structural node modifications detected.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {diffData.dsaDiffs.length === 0 && (
                  <div className="text-zinc-600 italic text-center py-4">
                    No tree, linkedlist, or dictionary nodes compared.
                  </div>
                )}
              </div>
            )}

            {/* CONSOLE OUTPUT DIFF */}
            {diffTab === "console" && (
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-sans font-bold text-zinc-500 uppercase tracking-wider">
                      Step A Console
                    </span>
                    <div className="bg-[#0B0B0B] border border-[#232323] p-2.5 rounded h-[120px] overflow-y-auto whitespace-pre-wrap select-text text-zinc-500 font-mono text-[10px]">
                      {diffData.logA || (
                        <span className="italic text-zinc-700">No output</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-sans font-bold text-zinc-500 uppercase tracking-wider">
                      Step B Console
                    </span>
                    <div className="bg-[#0B0B0B] border border-emerald-950/60 p-2.5 rounded h-[120px] overflow-y-auto whitespace-pre-wrap select-text text-zinc-300 font-mono text-[10px]">
                      {diffData.logB || (
                        <span className="italic text-zinc-700">No output</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-600 font-mono text-micro select-none">
          <GitCompare className="h-7 w-7 mb-2 text-[#22C55E] opacity-40 animate-pulse" />
          <span>Step Comparison standby.</span>
          <p className="text-[10px] mt-1 max-w-[220px] text-zinc-700">
            Select Step A and Step B to compare variables, matrices, stacks,
            heap memories, and console streams.
          </p>
        </div>
      )}
    </div>
  );
}
