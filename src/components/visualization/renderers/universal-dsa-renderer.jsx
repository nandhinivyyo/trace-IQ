import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { parseArrayValue } from "@/services/renderer-utils";
import { usePlayback } from "@/services/playback-store";
import {
  Layers,
  Database,
  GitMerge,
  LayoutGrid,
  HelpCircle,
  Network,
  ArrowRight,
} from "lucide-react";

// Helper to parse Python serialized dictionaries containing None/True/False/single quotes
function parsePythonDict(value) {
  if (!value) return null;
  try {
    const cleaned = value
      .replace(/'/g, '"')
      .replace(/\bNone\b/g, "null")
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false");
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

// Register modular adapters inside UniversalDsaRenderer
export const UniversalDsaRenderer = {
  id: "universal-dsa-renderer",
  name: "Universal DSA Layout",

  supports(step) {
    const vars = step.variablesAfter || [];
    return vars.some((v) => {
      const dt = (v.datatype || "").toLowerCase();
      const val = (v.value || "").trim();
      return (
        dt.includes("list") ||
        dt.includes("array") ||
        dt.includes("node") ||
        dt.includes("tree") ||
        dt.includes("graph") ||
        dt.includes("set") ||
        dt.includes("map") ||
        dt.includes("dict") ||
        dt.includes("stack") ||
        dt.includes("queue") ||
        dt.includes("deque") ||
        val.startsWith("[") ||
        val.startsWith("{")
      );
    });
  },

  getPriority() {
    return 40; // Default priority for common structures
  },

  render(props) {
    return <DsaVisualizerDispatcher {...props} />;
  },
};

function DsaVisualizerDispatcher({ step }) {
  // 1. Identify which structure type to render based on variable signatures
  const { structureType, targetVariable } = useMemo(() => {
    const vars = step.variablesAfter || [];

    // Explicit Node reference pointer detection (linked list / tree)
    const nodeVar = vars.find((v) => {
      const dt = (v.datatype || "").toLowerCase();
      const name = (v.name || "").toLowerCase();
      const isDSAKeyName =
        name === "curr" ||
        name === "head" ||
        name === "tail" ||
        name.startsWith("curr_") ||
        name.startsWith("head_") ||
        name.startsWith("tail_") ||
        name.endsWith("node") ||
        name.startsWith("node");
      return (
        v.scope !== "heap" &&
        v.referenceType &&
        (dt.includes("node") || isDSAKeyName)
      );
    });

    if (nodeVar) {
      const targetAddr = (nodeVar.value && nodeVar.value.startsWith("0x")) ? nodeVar.value : nodeVar.memoryAddress;
      const heapObj = vars.find((v) => v.memoryAddress === targetAddr);
      let isTree = false;
      if (heapObj) {
        const parsed = parsePythonDict(heapObj.value);
        if (parsed && ("left" in parsed || "right" in parsed)) {
          isTree = true;
        }
      } else {
        const dt = (nodeVar.datatype || "").toLowerCase();
        if (dt.includes("tree")) {
          isTree = true;
        }
      }
      return {
        structureType: isTree ? "tree" : "linkedlist",
        targetVariable: nodeVar,
      };
    }

    // Fallback Check Tree: Look for nodes containing both left/right child pointers
    const treeVar = vars.find((v) => {
      if (v.referenceType && v.value && v.value.startsWith("{")) {
        const parsed = parsePythonDict(v.value);
        return parsed && "left" in parsed && "right" in parsed;
      }
      return false;
    });
    if (treeVar) return { structureType: "tree", targetVariable: treeVar };

    // Fallback Check LinkedList: Look for nodes containing next pointer
    const listVar = vars.find((v) => {
      if (v.referenceType && v.value && v.value.startsWith("{")) {
        const parsed = parsePythonDict(v.value);
        return parsed && "next" in parsed;
      }
      return false;
    });
    if (listVar)
      return { structureType: "linkedlist", targetVariable: listVar };

    // Check Stack
    const stackVar = vars.find(
      (v) =>
        v.datatype.toLowerCase().includes("stack") ||
        v.name.toLowerCase().includes("stack"),
    );
    if (stackVar) return { structureType: "stack", targetVariable: stackVar };

    // Check Queue/Deque
    const queueVar = vars.find(
      (v) =>
        v.datatype.toLowerCase().includes("queue") ||
        v.datatype.toLowerCase().includes("deque") ||
        v.name.toLowerCase().includes("queue") ||
        v.name.toLowerCase().includes("q"),
    );
    if (queueVar) return { structureType: "queue", targetVariable: queueVar };

    // Check HashMap/HashSet
    const mapVar = vars.find(
      (v) =>
        v.datatype.toLowerCase().includes("map") ||
        v.datatype.toLowerCase().includes("set") ||
        v.datatype.toLowerCase().includes("dict") ||
        v.name.toLowerCase().includes("map") ||
        v.name.toLowerCase().includes("dict"),
    );
    if (mapVar) return { structureType: "hashmap", targetVariable: mapVar };

    // Check Graph
    const graphVar = vars.find(
      (v) =>
        v.datatype.toLowerCase().includes("graph") ||
        v.name.toLowerCase().includes("adj") ||
        v.name.toLowerCase().includes("graph"),
    );
    if (graphVar) return { structureType: "graph", targetVariable: graphVar };

    // Default fallback to first variable array/list if any
    const fallbackVar = vars[0];
    return { structureType: "list", targetVariable: fallbackVar };
  }, [step.variablesAfter]);

  if (!targetVariable) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-mono text-micro select-none">
        <HelpCircle className="h-6 w-6 stroke-[1.5] animate-pulse" />
        <span>Waiting for active scope variables...</span>
      </div>
    );
  }

  // 2. Dispatch to dedicated sub-renderer components
  switch (structureType) {
    case "tree":
      return <TreeVisualizer step={step} target={targetVariable} />;
    case "linkedlist":
      return <LinkedListVisualizer step={step} target={targetVariable} />;
    case "stack":
      return <StackVisualizer target={targetVariable} />;
    case "queue":
      return <QueueVisualizer target={targetVariable} />;
    case "hashmap":
      return <HashMapVisualizer step={step} target={targetVariable} />;
    case "graph":
      return <GraphVisualizer />;
    default:
      return <GenericListVisualizer target={targetVariable} />;
  }
}

// ============================================================================
// 1. LINKED LIST VISUALIZER
// ============================================================================

function LinkedListVisualizer({ step, target }) {
  const nodes = useMemo(() => {
    const list = [];
    const vars = step.variablesAfter || [];
    const visited = new Set();

    let currentAddr = (target.value && target.value.startsWith("0x"))
      ? target.value
      : target.memoryAddress;
    if (!currentAddr || currentAddr === "0x0" || currentAddr === "null")
      return [];

    while (currentAddr && currentAddr !== "0x0" && currentAddr !== "null") {
      if (visited.has(currentAddr)) {
        // Handle Circular Linked List backloop
        const lastNode = list[list.length - 1];
        if (lastNode) lastNode.next = currentAddr;
        break;
      }
      visited.add(currentAddr);

      const nodeVar = vars.find((v) => v.memoryAddress === currentAddr);
      if (!nodeVar) break;

      try {
        const fields = parsePythonDict(nodeVar.value);
        if (!fields) break;
        list.push({
          val: String(fields.val ?? fields.value ?? fields.data ?? nodeVar.name),
          addr: currentAddr,
          next: String(fields.next ?? "0x0"),
          prev: fields.prev ? String(fields.prev) : undefined,
        });
        currentAddr = String(fields.next ?? "0x0");
      } catch (e) {
        break;
      }
    }
    return list;
  }, [step.variablesAfter, target]);

  return (
    <div className="absolute inset-0 p-8 flex flex-col overflow-auto scrollbar-thin">
      <div className="m-auto flex flex-col items-center">
        <div className="flex items-center gap-2 mb-10 select-none shrink-0 font-mono text-micro text-zinc-500">
          <GitMerge className="h-4 w-4 text-[#22C55E]" />
          <span>
            Linked List: <strong className="text-zinc-300">{target.name}</strong> ({nodes.length} nodes detected)
          </span>
        </div>

        <div className="flex items-center gap-12 relative py-12 justify-start">
          {nodes.map((node, idx) => (
            <div key={node.addr} className="flex items-center relative select-none">
              {/* Head / Tail indicators */}
              {idx === 0 && idx === nodes.length - 1 && (
                <div className="absolute -top-10 left-3 flex flex-col items-center gap-0.5 text-emerald-400 font-black text-[9px] font-mono uppercase tracking-wider select-none animate-pulse">
                  <span>Head/Tail</span>
                  <span>↓</span>
                </div>
              )}
              {idx === 0 && idx !== nodes.length - 1 && (
                <div className="absolute -top-10 left-3 flex flex-col items-center gap-0.5 text-emerald-400 font-black text-[9px] font-mono uppercase tracking-wider select-none animate-pulse">
                  <span>Head</span>
                  <span>↓</span>
                </div>
              )}
              {idx === nodes.length - 1 && idx !== 0 && (
                <div className="absolute -top-10 left-3 flex flex-col items-center gap-0.5 text-blue-400 font-black text-[9px] font-mono uppercase tracking-wider select-none animate-pulse">
                  <span>Tail</span>
                  <span>↓</span>
                </div>
              )}

              {/* Node Address Tag */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 font-mono uppercase select-all">
                {node.addr.slice(0, 6)}
              </div>

              {/* Dual Compartment Container */}
              <motion.div
                layout
                className="flex items-center rounded-md overflow-hidden shadow-lg border-2 border-zinc-800 bg-zinc-900 hover:border-[#22C55E]/40 transition-colors"
              >
                {/* Data Compartment (Left) */}
                <div className="h-12 w-12 flex items-center justify-center bg-white text-zinc-950 font-black font-mono text-sm border-r-2 border-zinc-800">
                  {node.val}
                </div>
                {/* Next Pointer Compartment (Right) */}
                <div className="h-12 w-10 flex flex-col items-center justify-center bg-zinc-800 text-zinc-400 font-mono text-[8px] select-none">
                  <span className="text-[7px] text-zinc-500 uppercase tracking-widest leading-none">ptr</span>
                  <span className="font-bold mt-0.5 leading-none">
                    {node.next === "0x0" || node.next === "null"
                      ? "⏚"
                      : node.next.slice(0, 4)}
                  </span>
                </div>
              </motion.div>

              {/* Animated Connection Arrow to next node */}
              {idx < nodes.length - 1 && (
                <div className="absolute left-[88px] w-[48px] h-12 flex items-center justify-center select-none pointer-events-none">
                  <svg className="absolute w-[48px] h-12 overflow-visible">
                    <line
                      x1="0"
                      y1="24"
                      x2="44"
                      y2="24"
                      stroke="#22C55E"
                      strokeWidth="2.5"
                      strokeDasharray="4,4"
                      className="animate-dash"
                    />
                    <path d="M 38,19 L 44,24 L 38,29 Z" fill="#22C55E" />
                  </svg>
                </div>
              )}

              {/* Animated Connection Arrow to NULL (for last node) */}
              {idx === nodes.length - 1 && (
                <div className="absolute left-[88px] w-[48px] h-12 flex items-center justify-center select-none pointer-events-none">
                  <svg className="absolute w-[48px] h-12 overflow-visible">
                    <line
                      x1="0"
                      y1="24"
                      x2="44"
                      y2="24"
                      stroke="#71717A"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />
                    <path d="M 38,20 L 44,24 L 38,28 Z" fill="#71717A" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {/* Terminating NULL box */}
          {nodes.length > 0 && (
            <div className="border-2 border-dashed border-zinc-700 bg-zinc-950/80 text-zinc-500 font-mono rounded px-3 py-1.5 text-[10px] font-bold select-none tracking-wider uppercase shadow-md">
              NULL
            </div>
          )}

          {nodes.length === 0 && (
            <span className="text-zinc-600 font-mono text-micro select-none">
              Linked list contains no active reference nodes.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. STACK VISUALIZER
// ============================================================================

function StackVisualizer({ target }) {
  const { traces, currentStepIdx } = usePlayback();
  
  const prevTarget = useMemo(() => {
    if (currentStepIdx <= 0 || !traces) return null;
    const prevStep = traces[currentStepIdx - 1];
    return prevStep
      ? (prevStep.variablesAfter || []).find((v) => v.name === target.name)
      : null;
  }, [traces, currentStepIdx, target.name]);

  const elements = useMemo(() => {
    try {
      if (target.value && target.value.startsWith("[")) {
        const parsed = parseArrayValue(target.value);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return target.value ? [target.value] : [];
  }, [target.value]);

  const prevElements = useMemo(() => {
    if (!prevTarget) return [];
    try {
      if (prevTarget.value && prevTarget.value.startsWith("[")) {
        const parsed = parseArrayValue(prevTarget.value);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return prevTarget.value ? [prevTarget.value] : [];
  }, [prevTarget]);

  const { action, val } = useMemo(() => {
    if (elements.length > prevElements.length) {
      return { action: "push", val: elements[elements.length - 1] };
    } else if (elements.length < prevElements.length) {
      return { action: "pop", val: prevElements[prevElements.length - 1] };
    }
    return { action: "none", val: null };
  }, [elements, prevElements]);

  return (
    <div className="absolute inset-0 p-4 flex flex-col overflow-y-auto scrollbar-thin">
      <div className="m-auto flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4 select-none shrink-0 font-mono text-micro text-zinc-500">
          <Layers className="h-4 w-4 text-[#22C55E]" />
          <span>
            Stack: <strong className="text-zinc-300">{target.name}</strong> ({elements.length} elements)
          </span>
        </div>

        {/* Animation Overlay + Stack Wrapper */}
        <div className="relative flex flex-col items-center select-none pt-12">
          {/* Animated Curved Arrow for Push / Pop */}
          <div className="absolute -top-10 w-56 h-24 overflow-visible pointer-events-none z-10">
            {action === "push" && (
              <motion.div
                key={`push-${elements.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                  {/* Push curve from top-left into container */}
                  <path
                    d="M 15 15 Q 50 -15, 108 55"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="3.5"
                    className="animate-dash"
                  />
                  <path d="M 103,45 L 108,55 L 97,52 Z" fill="#22C55E" />
                  <text x="5" y="10" fill="#22C55E" fontSize="9px" fontWeight="black" fontFamily="monospace">PUSH</text>
                </svg>
                {/* Pushed item flying block */}
                <motion.div
                  initial={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
                  animate={{ x: 92, y: 40, scale: 1, opacity: 0.9 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute h-10 w-10 bg-emerald-500/10 border-2 border-emerald-500 border-dashed rounded text-emerald-400 flex items-center justify-center font-mono font-black text-sm"
                  style={{ top: 15, left: 10 }}
                >
                  {String(val)}
                </motion.div>
              </motion.div>
            )}

            {action === "pop" && (
              <motion.div
                key={`pop-${prevElements.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                  {/* Pop curve from container up to top-right */}
                  <path
                    d="M 108 55 Q 160 -15, 205 15"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="3.5"
                    className="animate-dash"
                  />
                  <path d="M 197,12 L 205,15 L 200,23 Z" fill="#EF4444" />
                  <text x="180" y="10" fill="#EF4444" fontSize="9px" fontWeight="black" fontFamily="monospace">POP</text>
                </svg>
                {/* Popped item flying block */}
                <motion.div
                  initial={{ x: 92, y: 55, scale: 1, opacity: 1 }}
                  animate={{ x: 190, y: 0, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute h-10 w-10 bg-red-500/10 border-2 border-red-500 border-dashed rounded text-red-400 flex items-center justify-center font-mono font-black text-sm"
                  style={{ top: 15, left: 10 }}
                >
                  {String(val)}
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* U-shaped Bucket Container */}
          <div className="relative w-44 border-x-[5px] border-b-[5px] border-zinc-400 bg-zinc-900/50 backdrop-blur-md rounded-b-2xl min-h-[180px] flex flex-col-reverse justify-start p-3 gap-2.5 shadow-2xl">
            {elements.map((el, idx) => (
              <div key={idx} className="relative w-full flex justify-center">
                {/* Top arrow pointer */}
                {idx === elements.length - 1 && (
                  <div className="absolute left-0 -translate-x-[calc(100%+8px)] top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#22C55E] font-black text-[11px] font-mono uppercase tracking-wider select-none animate-pulse">
                    <span>Top</span>
                    <span>→</span>
                  </div>
                )}
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`h-11 w-full flex items-center justify-center font-mono font-black text-sm rounded shadow-md border-2 border-zinc-800 ${
                    idx === elements.length - 1
                      ? "bg-[#22C55E] text-zinc-950 border-[#22C55E]"
                      : "bg-white text-zinc-950"
                  }`}
                >
                  {String(el)}
                </motion.div>
              </div>
            ))}

            {elements.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-10">
                <span className="text-zinc-600 italic select-none font-mono text-[10px]">
                  Empty Stack
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. QUEUE VISUALIZER
// ============================================================================

function QueueVisualizer({ target }) {
  const { traces, currentStepIdx } = usePlayback();

  const prevTarget = useMemo(() => {
    if (currentStepIdx <= 0 || !traces) return null;
    const prevStep = traces[currentStepIdx - 1];
    return prevStep
      ? (prevStep.variablesAfter || []).find((v) => v.name === target.name)
      : null;
  }, [traces, currentStepIdx, target.name]);

  const elements = useMemo(() => {
    try {
      if (target.value && target.value.startsWith("[")) {
        const parsed = parseArrayValue(target.value);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return target.value ? [target.value] : [];
  }, [target.value]);

  const prevElements = useMemo(() => {
    if (!prevTarget) return [];
    try {
      if (prevTarget.value && prevTarget.value.startsWith("[")) {
        const parsed = parseArrayValue(prevTarget.value);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return prevTarget.value ? [prevTarget.value] : [];
  }, [prevTarget]);

  const { action, val } = useMemo(() => {
    if (elements.length > prevElements.length) {
      return { action: "enqueue", val: elements[elements.length - 1] };
    } else if (elements.length < prevElements.length) {
      return { action: "dequeue", val: prevElements[0] };
    }
    return { action: "none", val: null };
  }, [elements, prevElements]);

  return (
    <div className="absolute inset-0 p-4 flex flex-col overflow-x-auto scrollbar-thin">
      <div className="m-auto flex flex-col items-center">
        <div className="flex items-center gap-2 mb-10 select-none shrink-0 font-mono text-micro text-zinc-500">
          <Database className="h-4 w-4 text-[#22C55E]" />
          <span>
            Queue: <strong className="text-zinc-300">{target.name}</strong> ({elements.length} elements)
          </span>
        </div>

        {/* Queue Conveyor Wrapper */}
        <div className="relative flex items-center select-none py-10">
          {/* Animated Overlay for Enqueue / Dequeue */}
          <div className="absolute inset-0 overflow-visible pointer-events-none z-10">
            {action === "enqueue" && (
              <motion.div
                key={`enqueue-${elements.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                <svg className="absolute top-0 right-[-80px] w-24 h-24 overflow-visible pointer-events-none">
                  {/* Curve entering from right into rear */}
                  <path
                    d="M 60 10 Q 30 10, -5 35"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="3"
                    className="animate-dash"
                  />
                  <path d="M -2,29 L -5,35 L 4,36 Z" fill="#22C55E" />
                  <text x="15" y="5" fill="#22C55E" fontSize="9px" fontWeight="black" fontFamily="monospace">ENQUEUE</text>
                </svg>
                {/* Enqueued flying block */}
                <motion.div
                  initial={{ x: 260, y: -20, scale: 0.5, opacity: 0 }}
                  animate={{ x: 200, y: 12, scale: 1, opacity: 0.9 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute h-10 w-10 bg-emerald-500/10 border-2 border-emerald-500 border-dashed rounded text-emerald-400 flex items-center justify-center font-mono font-black text-xs"
                >
                  {String(val)}
                </motion.div>
              </motion.div>
            )}

            {action === "dequeue" && (
              <motion.div
                key={`dequeue-${prevElements.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                <svg className="absolute top-0 left-[-80px] w-24 h-24 overflow-visible pointer-events-none">
                  {/* Curve exiting from front to left */}
                  <path
                    d="M 85 35 Q 50 10, 20 10"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="3"
                    className="animate-dash"
                  />
                  <path d="M 27,5 L 20,10 L 25,16 Z" fill="#EF4444" />
                  <text x="25" y="5" fill="#EF4444" fontSize="9px" fontWeight="black" fontFamily="monospace">DEQUEUE</text>
                </svg>
                {/* Dequeued flying block */}
                <motion.div
                  initial={{ x: 12, y: 12, scale: 1, opacity: 1 }}
                  animate={{ x: -60, y: -20, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute h-10 w-10 bg-red-500/10 border-2 border-red-500 border-dashed rounded text-red-400 flex items-center justify-center font-mono font-black text-xs"
                >
                  {String(val)}
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Horizontal open tube container */}
          <div className="relative flex items-center gap-3 px-6 py-4 border-y-[5px] border-zinc-400 bg-zinc-900/50 backdrop-blur-md min-w-[280px] min-h-[76px] justify-start shadow-2xl">
            {elements.map((el, idx) => (
              <div key={idx} className="relative">
                {/* Front pointer (down arrow from top) */}
                {idx === 0 && (
                  <div className="absolute top-0 -translate-y-[calc(100%+8px)] left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 text-emerald-400 font-black text-[10px] font-mono uppercase tracking-wider select-none animate-pulse">
                    <span>Front</span>
                    <span>↓</span>
                  </div>
                )}
                {/* Rear pointer (up arrow from bottom) */}
                {idx === elements.length - 1 && (
                  <div className="absolute bottom-0 translate-y-[calc(100%+8px)] left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 text-blue-400 font-black text-[10px] font-mono uppercase tracking-wider select-none animate-pulse">
                    <span>↑</span>
                    <span>Rear</span>
                  </div>
                )}
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className={`h-11 w-11 flex items-center justify-center font-mono font-black text-sm rounded shadow-md border-2 border-zinc-800 ${
                    idx === 0
                      ? "bg-[#22C55E] text-zinc-950 border-[#22C55E]"
                      : idx === elements.length - 1
                        ? "bg-blue-400 text-zinc-950 border-blue-400"
                        : "bg-white text-zinc-950"
                  }`}
                >
                  {String(el)}
                </motion.div>
              </div>
            ))}

            {elements.length === 0 && (
              <div className="flex-1 flex items-center justify-center px-12">
                <span className="text-zinc-600 italic select-none font-mono text-[10px]">
                  Empty Queue
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. TREE VISUALIZER (BINARY TREE / BST / AVL)
// ============================================================================

function TreeVisualizer({ step, target }) {
  // Recursively map binary tree coordinates starting from root variable address
  const { nodes, connections } = useMemo(() => {
    const vars = step.variablesAfter || [];
    const mappedNodes = {};
    const rootAddr = (target.value && target.value.startsWith("0x"))
      ? target.value
      : target.memoryAddress;
    if (!rootAddr || rootAddr === "0x0" || rootAddr === "null")
      return { nodes: [], connections: [] };

    // Traverse recursively to build coordinates grid
    const traverse = (addr, depth, xOffset, width) => {
      const nodeVar = vars.find((v) => v.memoryAddress === addr);
      if (!nodeVar) return;

      try {
        const fields = parsePythonDict(nodeVar.value);
        if (!fields) return;
        const leftAddr =
          fields.left && fields.left !== "0x0" && fields.left !== "null"
            ? String(fields.left)
            : null;
        const rightAddr =
          fields.right && fields.right !== "0x0" && fields.right !== "null"
            ? String(fields.right)
            : null;

        mappedNodes[addr] = {
          val: String(fields.val ?? fields.value ?? nodeVar.name),
          addr,
          left: leftAddr,
          right: rightAddr,
          x: xOffset,
          y: 40 + depth * 80,
        };

        if (leftAddr)
          traverse(leftAddr, depth + 1, xOffset - width / 2, width / 2);
        if (rightAddr)
          traverse(rightAddr, depth + 1, xOffset + width / 2, width / 2);
      } catch (e) {}
    };

    traverse(rootAddr, 0, 200, 200);

    const list = Object.values(mappedNodes);
    const edges = [];

    list.forEach((node) => {
      if (node.left && mappedNodes[node.left]) {
        edges.push({
          from: node.addr,
          to: node.left,
          fromX: node.x || 0,
          fromY: node.y || 0,
          toX: mappedNodes[node.left].x || 0,
          toY: mappedNodes[node.left].y || 0,
        });
      }
      if (node.right && mappedNodes[node.right]) {
        edges.push({
          from: node.addr,
          to: node.right,
          fromX: node.x || 0,
          fromY: node.y || 0,
          toX: mappedNodes[node.right].x || 0,
          toY: mappedNodes[node.right].y || 0,
        });
      }
    });

    return {
      nodes: list,
      connections: edges,
    };
  }, [step.variablesAfter, target]);

  return (
    <div className="absolute inset-0 p-8 flex flex-col overflow-auto scrollbar-thin">
      <div className="m-auto flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4 select-none shrink-0 font-mono text-micro text-zinc-500">
          <Network className="h-4 w-4 text-[#22C55E]" />
          <span>
            Hierarchical Binary Tree:{" "}
            <strong className="text-zinc-300">{nodes.length} nodes</strong>
          </span>
        </div>

        <div className="relative min-w-[500px] min-h-[380px] w-full max-w-lg">
        {/* Draw connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          {connections.map((edge, idx) => (
            <line
              key={idx}
              x1={edge.fromX + 20}
              y1={edge.fromY + 20}
              x2={edge.toX + 20}
              y2={edge.toY + 20}
              stroke="rgba(34,197,94,0.3)"
              strokeWidth={1.5}
            />
          ))}
        </svg>

        {/* Draw node circles */}
        {nodes.map((node) => (
          <motion.div
            key={node.addr}
            layout
            style={{ left: node.x, top: node.y }}
            className="absolute h-10 w-10 bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[#22C55E] rounded-full flex flex-col justify-center items-center font-mono shadow-md transition-colors"
          >
            <strong className="text-micro text-[var(--color-text-primary)]">
              {node.val}
            </strong>
            <span className="text-[6px] text-zinc-600 leading-none">
              {node.addr}
            </span>
          </motion.div>
        ))}

        {nodes.length === 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-zinc-700 italic select-none font-mono text-micro">
            Tree root reference is null / uninitialized.
          </span>
        )}
      </div>
    </div>
    </div>
  );
}

// ============================================================================
// 5. HASHMAP VISUALIZER
// ============================================================================

function HashMapVisualizer({ step, target }) {
  // Parse bucket cells and separate chain collisions
  const buckets = useMemo(() => {
    const array = [];
    for (let i = 0; i < 8; i++) {
      array.push({ idx: i });
    }
    try {
      if (target.value.startsWith("{")) {
        const fields = JSON.parse(target.value.replace(/'/g, '"'));
        Object.entries(fields).forEach(([k, v], index) => {
          const bucketIndex = index % 8; // Simple mock hashing distribution
          const existing = array[bucketIndex];
          if (!existing.key) {
            existing.key = k;
            existing.value = String(v);
          } else {
            // Collision chain simulation
            let curr = existing;
            while (curr.next) {
              curr = curr.next;
            }
            curr.next = { key: k, value: String(v) };
          }
        });
      }
    } catch (e) {}

    return array;
  }, [target.value, step.variablesAfter]);

  return (
    <div className="absolute inset-0 p-8 flex flex-col overflow-y-auto scrollbar-thin">
      <div className="m-auto flex flex-col items-center">
        <div className="flex items-center gap-2 mb-6 select-none shrink-0 font-mono text-micro text-zinc-500">
          <LayoutGrid className="h-4 w-4 text-[#22C55E]" />
          <span>HashMap Buckets (Separate Chaining)</span>
        </div>

        <div className="flex flex-col gap-3 w-80">
        {buckets.map((b) => (
          <div key={b.idx} className="flex items-center gap-4">
            {/* Bucket cell */}
            <div className="h-9 w-12 border border-[#232323] bg-[#111111] rounded-l flex items-center justify-center font-mono text-micro font-bold text-zinc-500 select-none">
              [{b.idx}]
            </div>

            {/* Collision chain list */}
            {b.key ? (
              <div className="flex items-center gap-2">
                <div className="h-9 px-3 rounded border border-[#22C55E]/40 bg-[#22C55E]/5 flex flex-col justify-center font-mono text-micro text-zinc-400">
                  <span className="text-[8px] text-[#22C55E]">
                    key: {b.key}
                  </span>
                  <strong>val: {b.value}</strong>
                </div>

                {/* Colliding children */}
                {b.next && <HashChainNode node={b.next} />}
              </div>
            ) : (
              <span className="text-zinc-700 italic select-none font-mono text-[9px]">
                null (empty bucket)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

function HashChainNode({ node }) {
  return (
    <div className="flex items-center gap-2">
      <ArrowRight className="h-3 w-3 text-emerald-600" />
      <div className="h-9 px-3 rounded border border-blue-500/40 bg-blue-950/20 flex flex-col justify-center font-mono text-micro text-zinc-400">
        <span className="text-[8px] text-blue-400">key: {node.key}</span>
        <strong>val: {node.value}</strong>
      </div>
      {node.next && <HashChainNode node={node.next} />}
    </div>
  );
}

// ============================================================================
// 6. GRAPH VISUALIZER
// ============================================================================

function GraphVisualizer() {
  const { vertices, edges } = useMemo(() => {
    // Generate mock graph coordinates circular topology
    const nodesList = ["A", "B", "C", "D", "E"];
    const graphNodes = nodesList.map((id, index) => {
      const angle = (index * 2 * Math.PI) / nodesList.length;
      return {
        id,
        x: 180 + Math.cos(angle) * 110,
        y: 160 + Math.sin(angle) * 110,
      };
    });

    const connections = [
      { from: "A", to: "B", weight: 4 },
      { from: "B", to: "C", weight: 2 },
      { from: "C", to: "D", weight: 7 },
      { from: "D", to: "E", weight: 1 },
      { from: "E", to: "A", weight: 5 },
      { from: "A", to: "C", weight: 3 },
    ];

    return {
      vertices: graphNodes,
      edges: connections,
    };
  }, []);

  return (
    <div className="absolute inset-0 p-8 flex flex-col overflow-auto scrollbar-thin">
      <div className="m-auto flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4 select-none shrink-0 font-mono text-micro text-zinc-500">
          <Network className="h-4 w-4 text-[#22C55E]" />
          <span>Weighted Directed Graph Layout</span>
        </div>

        <div className="relative min-w-[400px] min-h-[340px] w-full max-w-md">
        {/* Draw connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          {edges.map((edge, idx) => {
            const fromNode = vertices.find((v) => v.id === edge.from);
            const toNode = vertices.find((v) => v.id === edge.to);
            if (!fromNode || !toNode) return null;

            return (
              <g key={idx}>
                <line
                  x1={fromNode.x + 18}
                  y1={fromNode.y + 18}
                  x2={toNode.x + 18}
                  y2={toNode.y + 18}
                  stroke="rgba(34,197,94,0.3)"
                  strokeWidth={1.5}
                />

                {/* Weight label */}
                <text
                  x={(fromNode.x + toNode.x) / 2 + 20}
                  y={(fromNode.y + toNode.y) / 2 + 10}
                  fill="#22C55E"
                  fontSize="8px"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  w:{edge.weight}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Draw vertex boxes */}
        {vertices.map((v) => (
          <motion.div
            key={v.id}
            layout
            style={{ left: v.x, top: v.y }}
            className="absolute h-9 w-9 bg-[#111111] border border-[#232323] hover:border-[#22C55E] rounded flex items-center justify-center font-mono font-bold text-micro text-[var(--color-text-primary)] shadow-md transition-colors"
          >
            {v.id}
          </motion.div>
        ))}
      </div>
    </div>
    </div>
  );
}

// ============================================================================
// 7. GENERIC FALLBACK LIST VISUALIZER
// ============================================================================

function GenericListVisualizer({ target }) {
  const elements = useMemo(() => {
    try {
      if (target.value.startsWith("[")) {
        const parsed = parseArrayValue(target.value);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [target.value];
  }, [target.value]);

  return (
    <div className="absolute inset-0 p-8 flex flex-col overflow-x-auto scrollbar-thin">
      <div className="m-auto flex flex-col items-center">
        <div className="flex items-center gap-2 mb-6 select-none shrink-0 font-mono text-micro text-zinc-500">
          <LayoutGrid className="h-4 w-4 text-[#22C55E]" />
          <span>
            List structure:{" "}
            <strong className="text-zinc-300">{target.name}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 p-2 bg-[#111111]/30 rounded-sm">
        {elements.map((el, idx) => (
          <motion.div
            key={idx}
            layout
            className="h-10 w-16 rounded border border-[#232323] bg-[#111111] hover:border-[#22C55E]/50 flex flex-col items-center justify-center font-mono text-micro shadow-sm transition-colors"
          >
            <span className="text-[8px] text-zinc-600">[{idx}]</span>
            <strong className="text-zinc-300 truncate max-w-[50px]">
              {String(el)}
            </strong>
          </motion.div>
        ))}
      </div>
    </div>
    </div>
  );
}
