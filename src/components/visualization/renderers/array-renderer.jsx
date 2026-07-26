import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseArrayValue, getElementAddress } from "@/services/renderer-utils";
import {
  Play,
  BarChart,
  Database,
  ListFilter,
  AlertCircle,
} from "lucide-react";

// Standard pointers to detect automatically
const POINTER_NAMES = [
  "i",
  "j",
  "k",
  "left",
  "right",
  "mid",
  "low",
  "high",
  "pivot",
  "windowStart",
  "windowEnd",
  "prefixIndex",
  "currentIndex",
  "min_idx",
  "max_idx",
  "p",
  "q",
  "start",
  "end",
];

// Helper: detect if a string value is primitive numeric or float
const getElementDatatype = (val) => {
  if (typeof val === "number") {
    return Number.isInteger(val) ? "int" : "float";
  }
  if (typeof val === "boolean") return "bool";
  if (typeof val === "string") {
    return val.length === 1 ? "char" : "string";
  }
  if (typeof val === "object" && val !== null) return "object";
  return "unknown";
};

export const ArrayRenderer = {
  id: "array-renderer",
  name: "Array/Matrix Layout",

  supports(step) {
    const vars = step.variablesAfter || [];
    return vars.some(
      (v) =>
        v.name !== "args" &&
        !v.name.toLowerCase().includes("stack") &&
        !v.name.toLowerCase().includes("queue") &&
        !v.name.toLowerCase().includes("q") &&
        !v.datatype.toLowerCase().includes("stack") &&
        !v.datatype.toLowerCase().includes("queue") && (
          v.datatype.toLowerCase().includes("list") ||
          v.datatype.toLowerCase().includes("array") ||
          v.datatype.includes("[]") ||
          v.name === "arr" ||
          v.name === "nums" ||
          (v.value && v.value.trim().startsWith("[") && v.value.trim().endsWith("]"))
        ),
    );
  },

  getPriority() {
    return 50; // High priority for arrays
  },

  renderHeader(props) {
    return <ArrayHeader {...props} />;
  },

  render(props) {
    return <ArrayVisualizer {...props} />;
  },
};

export function ArrayHeader({ step, activeVariable, onSelectVariable }) {
  const arrayVariables = useMemo(() => {
    const vars = step.variablesAfter || [];
    return vars.filter(
      (v) =>
        v.name !== "args" && (
          v.datatype.toLowerCase().includes("list") ||
          v.datatype.toLowerCase().includes("array") ||
          v.datatype.includes("[]") ||
          (v.value && v.value.trim().startsWith("[") && v.value.trim().endsWith("]"))
        ),
    );
  }, [step.variablesAfter]);

  const currentVar = useMemo(() => {
    if (
      activeVariable &&
      arrayVariables.some((v) => v.name === activeVariable)
    ) {
      return arrayVariables.find((v) => v.name === activeVariable);
    }
    return arrayVariables.length > 0 ? arrayVariables[0] : null;
  }, [activeVariable, arrayVariables]);

  const arrayData = useMemo(() => {
    if (!currentVar) return null;
    return parseArrayValue(currentVar.value);
  }, [currentVar]);

  const is2DMatrix = useMemo(() => {
    if (!arrayData) return false;
    return (
      Array.isArray(arrayData) &&
      arrayData.length > 0 &&
      Array.isArray(arrayData[0])
    );
  }, [arrayData]);

  if (!currentVar || !arrayData) return null;

  return (
    <div className="flex-1 flex items-center justify-between font-sans text-micro">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-[#22C55E]">
          <ListFilter className="h-4 w-4" />
          <span>Active Datastructure:</span>
        </div>
        {arrayVariables.length > 1 ? (
          <select
            value={currentVar.name}
            onChange={(e) => onSelectVariable(e.target.value)}
            className="h-7 rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 text-micro font-semibold text-[var(--color-text-primary)] cursor-pointer font-sans"
          >
            {arrayVariables.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.datatype})
              </option>
            ))}
          </select>
        ) : (
          <span className="font-mono bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-2 py-0.5 rounded text-[var(--color-text-primary)] font-bold">
            {currentVar.name} : {currentVar.datatype}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-zinc-500 font-mono">
        <span>
          len:{" "}
          {is2DMatrix
            ? `${arrayData.length}x${arrayData[0].length}`
            : arrayData.length}
        </span>
      </div>
    </div>
  );
}

function ArrayVisualizer({
  step,
  selectedNodeId,
  onSelectNode,
  activeVariable,
  onSelectVariable,
  animationSpeed,
  pan,
  zoom,
}) {
  // 1. Identify all array-like variables in the current scope
  const arrayVariables = useMemo(() => {
    const vars = step.variablesAfter || [];
    return vars.filter(
      (v) =>
        v.name !== "args" && (
          v.datatype.toLowerCase().includes("list") ||
          v.datatype.toLowerCase().includes("array") ||
          v.datatype.includes("[]") ||
          (v.value.trim().startsWith("[") && v.value.trim().endsWith("]"))
        ),
    );
  }, [step.variablesAfter]);

  // Determine active variable to display
  const currentVar = useMemo(() => {
    if (
      activeVariable &&
      arrayVariables.some((v) => v.name === activeVariable)
    ) {
      return arrayVariables.find((v) => v.name === activeVariable);
    }
    return arrayVariables.length > 0 ? arrayVariables[0] : null;
  }, [activeVariable, arrayVariables]);

  // Sync back selection if auto-picked first
  useEffect(() => {
    if (currentVar && activeVariable !== currentVar.name) {
      onSelectVariable(currentVar.name);
    }
  }, [currentVar, activeVariable, onSelectVariable]);

  // Parse variable value
  const arrayData = useMemo(() => {
    if (!currentVar) return null;
    const parsed = parseArrayValue(currentVar.value);
    if (!parsed) return null;
    return parsed;
  }, [currentVar]);

  // Detect dimension (1D array vs 2D Matrix)
  const is2DMatrix = useMemo(() => {
    if (!arrayData) return false;
    return (
      Array.isArray(arrayData) &&
      arrayData.length > 0 &&
      Array.isArray(arrayData[0])
    );
  }, [arrayData]);

  // Compute pointer mappings from current variables frame
  const pointersMap = useMemo(() => {
    const mapping = {};
    const vars = step.variablesAfter || [];
    vars.forEach((v) => {
      if (POINTER_NAMES.includes(v.name)) {
        const val = parseInt(v.value);
        if (!isNaN(val)) {
          if (!mapping[val]) mapping[val] = [];
          if (!mapping[val].includes(v.name)) {
            mapping[val].push(v.name);
          }
        }
      }
    });
    return mapping;
  }, [step.variablesAfter]);

  // Compile loops information
  const loopsInfo = useMemo(() => {
    const vars = step.variablesAfter || [];
    const info = {};
    // Scan standard loop indexing variables (like loop pass counts or outer iteration markers)
    vars.forEach((v) => {
      if (
        ["pass", "passCount", "iteration", "count", "loopCount"].includes(
          v.name,
        )
      ) {
        info[v.name] = v.value;
      }
    });

    if (step.loopInformation) {
      info["Outer Loop"] = String(step.loopInformation.outerLoopNumber);
      info["Inner Loop"] = String(step.loopInformation.innerLoopNumber);
      info["Iteration"] = String(step.loopInformation.iterationNumber);
    }
    return info;
  }, [step.variablesAfter, step.loopInformation]);

  // Trace algorithm operations (Compares and Swaps counters calculated dynamically)
  const [compares, setCompares] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [assignments, setAssignments] = useState(0);

  // Scan current step source code line for metrics
  useEffect(() => {
    if (step.stepNumber <= 1) {
      setCompares(0);
      setSwaps(0);
      setAssignments(0);
      return;
    }
    const source = (step.executedSourceCode || "").toLowerCase();
    const isComp =
      source.includes("<") ||
      source.includes(">") ||
      source.includes("==") ||
      source.includes("compare");
    const isSwap =
      source.includes("swap") ||
      source.includes("temp =") ||
      (source.includes("arr[") && source.includes("="));
    const isAssign = source.includes("=") && !source.includes("==");

    if (isComp) setCompares((c) => c + 1);
    if (isSwap) setSwaps((s) => s + 1);
    if (isAssign && !isSwap) setAssignments((a) => a + 1);
  }, [step.stepNumber, step.executedSourceCode]);

  // Track FPS dynamically
  const [fps, setFps] = useState(60);
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let rId = 0;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      rId = requestAnimationFrame(tick);
    };
    rId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rId);
  }, []);

  if (!currentVar || !arrayData) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 border border-[#232323] bg-[#111111] p-6 rounded-[var(--radius-md)] text-zinc-500 max-w-sm text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 animate-bounce" />
          <h4 className="text-caption font-bold text-zinc-300">
            Array Unresolved
          </h4>
          <p className="text-micro leading-relaxed text-zinc-500">
            Ensure active variable represents a valid array index matrix array
            format.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full select-none text-[var(--color-text-secondary)]">
      {/* 2. Visualizer Canvas Body wrapper */}
      <div className="flex-1 relative min-h-0 flex items-center p-2 pt-2 overflow-hidden">
        {is2DMatrix ? (
          <MatrixGrid
            matrix={arrayData}
            pointersMap={pointersMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            baseAddress={currentVar.memoryAddress}
          />
        ) : (
          <Array1DGrid
            array={arrayData}
            pointersMap={pointersMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            baseAddress={currentVar.memoryAddress}
            step={step}
            animationSpeed={animationSpeed}
          />
        )}

        {/* Dynamic HUD loop & pass metrics overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 shrink-0 max-w-[240px]">
          {/* Loops panel */}
          {Object.keys(loopsInfo).length > 0 && (
            <div className="border border-[#232323] bg-[#111111]/90 backdrop-blur-sm p-3 rounded-[var(--radius-sm)] flex flex-col gap-1.5 shadow-lg select-text">
              <div className="flex items-center gap-1.5 border-b border-[#232323] pb-1">
                <Play className="h-3 w-3 fill-[#22C55E] text-[#22C55E]" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Loops Sync
                </span>
              </div>
              <div className="flex flex-col gap-1 font-mono text-micro text-zinc-300">
                {Object.entries(loopsInfo).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-zinc-500">{k}:</span>
                    <strong className="text-[#22C55E]">{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 1D ARRAY COMPONENT WITH CENTERED VIEWPORT SLICING (VIRTUALIZATION)
// ============================================================================

function Array1DGrid({
  array,
  pointersMap,
  selectedNodeId,
  onSelectNode,
  baseAddress,
  step,
}) {
  // Determine index highlights based on standard algorithm steps
  const source = (step.executedSourceCode || "").toLowerCase();
  // Rule engine highlights
  const highlightedIndices = useMemo(() => {
    const highlights = {};
    // 1. Mark pointers
    Object.entries(pointersMap).forEach(([idxStr, ptrs]) => {
      const idx = parseInt(idxStr);
      if (ptrs.some((p) => ["i", "j", "k", "currentIndex"].includes(p))) {
        highlights[idx] = "green";
      } else if (ptrs.some((p) => ["pivot", "mid"].includes(p))) {
        highlights[idx] = "blue";
      } else if (ptrs.some((p) => ["min_idx", "low"].includes(p))) {
        highlights[idx] = "yellow";
      } else if (ptrs.some((p) => ["max_idx", "high"].includes(p))) {
        highlights[idx] = "red";
      }
    });

    // 2. Swaps highlight
    const hasSwap = source.includes("swap") || source.includes("temp");
    if (hasSwap) {
      Object.keys(pointersMap).forEach((idxStr) => {
        highlights[parseInt(idxStr)] = "orange";
      });
    }

    // 3. Comparisons highlight
    const hasComp =
      source.includes("<") || source.includes(">") || source.includes("==");
    if (hasComp && !hasSwap) {
      Object.keys(pointersMap).forEach((idxStr) => {
        const idx = parseInt(idxStr);
        if (!highlights[idx] || highlights[idx] === "green") {
          highlights[idx] = "blue";
        }
      });
    }

    // 4. Sorted partitions (e.g. elements below pivot or lower than 'i' in sorting loops)
    const iVal = step.variablesAfter?.find((v) => v.name === "i")?.value;
    const iIdx = parseInt(iVal || "");
    if (!isNaN(iIdx)) {
      for (let idx = 0; idx < iIdx; idx++) {
        if (!highlights[idx]) highlights[idx] = "purple";
      }
    }

    return highlights;
  }, [pointersMap, source, step.variablesAfter]);

  // Index-Centered virtualization window slicing (to scale up to 100,000+ items)
  const windowedSlice = useMemo(() => {
    const maxVisible = 25;
    if (array.length <= maxVisible) {
      return {
        sliced: array.map((val, idx) => ({ val, idx })),
        startTruncated: 0,
        endTruncated: 0,
      };
    }

    // Find center point coordinates based on pointers index
    const pointerPositions = Object.keys(pointersMap).map(Number);
    const centerPoint =
      pointerPositions.length > 0
        ? Math.floor(
            pointerPositions.reduce((a, b) => a + b, 0) /
              pointerPositions.length,
          )
        : 0;

    let start = Math.max(0, centerPoint - 10);
    let end = Math.min(array.length, centerPoint + 15);

    // Keep range static size
    if (end - start < maxVisible) {
      const diff = maxVisible - (end - start);
      end = Math.min(array.length, end + diff);
      start = Math.max(0, start - (maxVisible - (end - start)));
    }

    const sliced = [];
    for (let idx = start; idx < end; idx++) {
      sliced.push({ val: array[idx], idx });
    }

    return {
      sliced,
      startTruncated: start,
      endTruncated: array.length - end,
    };
  }, [array, pointersMap]);

  // Calculate dynamic card size based on array length to prevent overflow
  const cardSize = useMemo(() => {
    const len = array.length;
    if (len <= 8) {
      return {
        card: "h-12 w-12",
        text: "text-[13px]",
        idxText: "text-[10px]",
        gap: "gap-2",
      };
    } else if (len <= 15) {
      return {
        card: "h-10 w-10",
        text: "text-[11px]",
        idxText: "text-[9px]",
        gap: "gap-1.5",
      };
    } else if (len <= 25) {
      return {
        card: "h-8 w-8",
        text: "text-[9px]",
        idxText: "text-[8px]",
        gap: "gap-1",
      };
    } else {
      return {
        card: "h-7 w-7",
        text: "text-[8px]",
        idxText: "text-[7px]",
        gap: "gap-0.5",
      };
    }
  }, [array.length]);

  return (
    <div className="flex flex-col items-center gap-4 py-2 px-1 mx-auto">
      {/* 1D Horizontal list element cards */}
      <div id="heap-object-array-grid" className={`flex items-center ${cardSize.gap}`}>
        {/* Left truncation indicator */}
        {windowedSlice.startTruncated > 0 && (
          <div className="flex flex-col items-center gap-2 select-none">
            <span className="text-[10px] font-bold font-mono text-zinc-600">
              idx 0
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)]/30 text-micro text-zinc-500 font-bold">
              +{windowedSlice.startTruncated}
            </div>
            <span className="text-[10px] text-zinc-600">truncated</span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {windowedSlice.sliced.map(({ val, idx }) => {
            const state = highlightedIndices[idx] || "gray";
            const nodePointers = pointersMap[idx] || [];
            const nodeId = `array-cell-${idx}`;
            const isSelected = selectedNodeId === nodeId;
            const datatype = getElementDatatype(val);
            const address = getElementAddress(
              baseAddress,
              idx,
              datatype === "float" || datatype === "int" ? 4 : 8,
            );

            // Styling variables based on rule colors
            let borderStyle = "border-[var(--color-border)]";
            let bgStyle = "bg-[var(--color-surface-raised)]";
            let textGlow = "text-[var(--color-text-primary)]";
            let stateBadge = null;

            if (state === "green") {
              borderStyle = "border-[var(--color-accent)]";
              bgStyle = "bg-[var(--color-accent-subtle)]";
              textGlow = "text-[var(--color-accent-text)]";
              stateBadge = "Current";
            } else if (state === "blue") {
              borderStyle = "border-blue-500";
              bgStyle = "bg-blue-500/10";
              textGlow = "text-blue-600 dark:text-blue-400";
              stateBadge = "Compare";
            } else if (state === "orange") {
              borderStyle = "border-orange-500 animate-pulse";
              bgStyle = "bg-orange-500/10";
              textGlow = "text-orange-600 dark:text-orange-400";
              stateBadge = "Swap";
            } else if (state === "purple") {
              borderStyle = "border-purple-600";
              bgStyle = "bg-purple-600/10";
              textGlow = "text-purple-600 dark:text-purple-400";
            } else if (state === "yellow") {
              borderStyle = "border-yellow-500";
              bgStyle = "bg-yellow-500/10";
              textGlow = "text-yellow-600 dark:text-yellow-400";
              stateBadge = "Min";
            } else if (state === "red") {
              borderStyle = "border-red-500";
              bgStyle = "bg-red-500/10";
              textGlow = "text-red-600 dark:text-red-400";
              stateBadge = "Max";
            }

            return (
              <motion.div
                key={`idx-${idx}`}
                layoutId={`array-card-${idx}`}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={() => onSelectNode(isSelected ? null : nodeId)}
                className={`group flex flex-col items-center gap-1.5 cursor-pointer relative shrink-0 ${
                  isSelected ? "scale-105 z-10" : "hover:scale-102"
                }`}
              >
                {/* Index tag & Down pointer */}
                <div className="flex flex-col items-center">
                  <span className={`${cardSize.idxText} font-bold font-mono text-zinc-500 group-hover:text-[var(--color-text-primary)]`}>
                    idx {idx}
                  </span>
                  <span className="text-[9px] text-zinc-600 leading-none mt-0.5">
                    ↓
                  </span>
                </div>

                {/* Main Node Card block */}
                <div
                  title={`Address: ${address}\nType: ${datatype}${stateBadge ? `\nState: ${stateBadge}` : ""}`}
                  className={`${cardSize.card} rounded border flex items-center justify-center transition-all duration-150 ${borderStyle} ${bgStyle} ${
                    isSelected
                      ? "shadow-[0_0_12px_rgba(34,197,94,0.15)] ring-1 ring-[#22C55E]/40"
                      : "shadow-md"
                  }`}
                >
                  {/* Value */}
                  <span
                    className={`${cardSize.text} font-bold font-mono text-center truncate px-1 select-text ${textGlow}`}
                  >
                    {String(val)}
                  </span>
                </div>

                {/* Statically stacked pointer labels under card */}
                {
                  nodePointers.length > 0 ? (
                    <div className="flex flex-col items-center gap-1 z-10 mt-1 select-none">
                      {nodePointers.map((ptr) => (
                        <div
                          key={ptr}
                          className="flex items-center gap-1 border border-[var(--color-accent)] bg-[var(--color-surface-raised)]/95 text-[9px] font-mono font-bold text-[var(--color-accent-text)] px-1.5 py-0.5 rounded shadow-lg animate-pulse"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                          <span>{ptr}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-6" />
                  ) // Placeholder spacing
                }
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Right truncation indicator */}
        {windowedSlice.endTruncated > 0 && (
          <div className="flex flex-col items-center gap-2 select-none">
            <span className="text-[10px] font-bold font-mono text-zinc-600">
              idx {array.length - 1}
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)]/30 text-micro text-zinc-500 font-bold">
              +{windowedSlice.endTruncated}
            </div>
            <span className="text-[10px] text-zinc-600">truncated</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2D MATRIX COMPONENT
// ============================================================================

function MatrixGrid({
  matrix,
  pointersMap,
  selectedNodeId,
  onSelectNode,
  baseAddress,
}) {
  // Compute matrix coordinates pointers
  const cellPointers = useMemo(() => {
    const cells = {};
    // Look at variables: if we have pointers r and c, we look at their values
    return cells;
  }, [pointersMap]);

  // Calculate dynamic matrix cell size based on column/row count
  const cellSize = useMemo(() => {
    const rows = matrix.length;
    const cols = matrix[0]?.length || 0;
    const maxDim = Math.max(rows, cols);
    
    if (maxDim <= 4) {
      return {
        padding: "p-3",
        minWidth: "min-w-[50px]",
        text: "text-[13px]",
        headerText: "text-[10px]",
      };
    } else if (maxDim <= 7) {
      return {
        padding: "p-2.5",
        minWidth: "min-w-[40px]",
        text: "text-[11px]",
        headerText: "text-[9px]",
      };
    } else if (maxDim <= 12) {
      return {
        padding: "p-1.5",
        minWidth: "min-w-[32px]",
        text: "text-[9px]",
        headerText: "text-[8px]",
      };
    } else {
      return {
        padding: "p-1",
        minWidth: "min-w-[24px]",
        text: "text-[8px]",
        headerText: "text-[7px]",
      };
    }
  }, [matrix]);

  return (
    <div id="heap-object-matrix-grid" className="flex flex-col gap-2 mx-auto p-2 border border-[#232323] bg-[#111111] rounded-[var(--radius-md)] shadow-2xl select-text">
      <div className="flex items-center gap-2 pb-1 border-b border-[#232323] mb-2 select-none">
        <Database className="h-4 w-4 text-[#22C55E]" />
        <h4 className="text-caption font-bold text-[var(--color-text-primary)]">
          2D Matrix Renderer
        </h4>
      </div>

      <table className="border-collapse font-mono text-micro leading-none text-zinc-400">
        <thead>
          <tr>
            {/* Corner header */}
            <th className={`p-2 border border-zinc-900 bg-[#161616] ${cellSize.headerText} text-zinc-600 select-none`}>
              r\c
            </th>
            {matrix[0]?.map((_, cIdx) => (
              <th
                key={cIdx}
                className={`p-2 border border-zinc-900 bg-[#161616] ${cellSize.headerText} text-zinc-500 font-bold text-center select-none`}
              >
                col {cIdx}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rIdx) => (
            <tr key={rIdx}>
              {/* Row header */}
              <td className={`p-2 border border-zinc-900 bg-[#161616] ${cellSize.headerText} font-bold text-zinc-500 text-center select-none`}>
                row {rIdx}
              </td>

              {row.map((val, cIdx) => {
                const nodeId = `matrix-cell-${rIdx}-${cIdx}`;
                const isSelected = selectedNodeId === nodeId;
                const datatype = getElementDatatype(val);
                const cellIndex = rIdx * row.length + cIdx;
                const address = getElementAddress(
                  baseAddress,
                  cellIndex,
                  datatype === "float" || datatype === "int" ? 4 : 8,
                );
                const cellPtrs = cellPointers[`${rIdx},${cIdx}`] || [];

                return (
                  <td
                    key={cIdx}
                    onClick={() => onSelectNode(isSelected ? null : nodeId)}
                    className={`${cellSize.padding} border border-zinc-900 text-center cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-950/20 text-[#22C55E] border-[#22C55E] font-bold shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]"
                        : "bg-[#0B0B0B] hover:bg-[#161616]/50 text-zinc-300"
                    }`}
                    title={`Index: ${cellIndex}\nAddress: ${address}\nDatatype: ${datatype}`}
                  >
                    <div className={`flex flex-col gap-1 items-center justify-center ${cellSize.minWidth} relative`}>
                      <span className={`font-bold ${cellSize.text}`}>
                        {String(val)}
                      </span>
                      {cellPtrs.length > 0 && (
                        <div className="absolute -bottom-1 flex gap-0.5 z-10 select-none">
                          {cellPtrs.map((p) => (
                            <span
                              key={p}
                              className="text-[8px] bg-[#22C55E] text-black px-0.5 rounded font-bold"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
