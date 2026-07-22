import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { parseArrayValue } from "@/services/renderer-utils";
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
      return (
        v.scope !== "heap" &&
        v.referenceType &&
        (dt.includes("node") || name.includes("head") || name.includes("curr"))
      );
    });

    if (nodeVar) {
      const targetAddr = nodeVar.value.startsWith("0x") ? nodeVar.value : nodeVar.memoryAddress;
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
      if (v.referenceType && v.value.startsWith("{")) {
        const parsed = parsePythonDict(v.value);
        return parsed && "left" in parsed && "right" in parsed;
      }
      return false;
    });
    if (treeVar) return { structureType: "tree", targetVariable: treeVar };

    // Fallback Check LinkedList: Look for nodes containing next pointer
    const listVar = vars.find((v) => {
      if (v.referenceType && v.value.startsWith("{")) {
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

    let currentAddr = target.value.startsWith("0x")
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
          val: String(fields.val ?? fields.value ?? nodeVar.name),
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
        <div className="flex items-center gap-2 mb-6 select-none shrink-0 font-mono text-micro text-zinc-500">
          <GitMerge className="h-4 w-4 text-[#22C55E]" />
          <span>
            List chain:{" "}
            <strong className="text-zinc-300">
              {nodes.length} nodes detected
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-12 relative py-8">
        {nodes.map((node, idx) => (
          <div key={node.addr} className="flex items-center relative">
            <motion.div
              layout
              className="flex flex-col items-center justify-center h-16 w-24 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-md font-mono select-text text-center shadow-md hover:border-[#22C55E]/50 transition-colors"
            >
              <span className="text-[10px] text-zinc-500">{node.addr}</span>
              <strong className="text-body text-[var(--color-text-primary)]">
                {node.val}
              </strong>
              {idx === 0 && (
                <span className="absolute -top-6 text-[8px] font-bold text-[#22C55E] tracking-wider uppercase select-none">
                  HEAD
                </span>
              )}
              {idx === nodes.length - 1 && (
                <span className="absolute -top-6 text-[8px] font-bold text-[#22C55E] tracking-wider uppercase select-none">
                  TAIL
                </span>
              )}
            </motion.div>

            {idx < nodes.length - 1 && (
              <div className="absolute left-[96px] w-[48px] flex items-center justify-center select-none pointer-events-none">
                <ArrowRight className="h-4 w-4 text-[#22C55E] animate-pulse" />
                {node.prev && (
                  <span className="absolute text-[8px] text-zinc-600 top-4 font-mono select-none">
                    prev
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

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
    <div className="absolute inset-0 p-8 flex flex-col overflow-y-auto scrollbar-thin">
      <div className="m-auto flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4 select-none shrink-0 font-mono text-micro text-zinc-500">
          <Layers className="h-4 w-4 text-[#22C55E]" />
          <span>
            Stack Elements Count:{" "}
            <strong className="text-zinc-300">{elements.length}</strong>
          </span>
        </div>

        <div className="flex flex-col-reverse w-48 border-x-2 border-b-2 border-[var(--color-border)] p-2 bg-[var(--color-surface-raised)]/30 rounded-b-md min-h-[160px] justify-start gap-2">
        {elements.map((el, idx) => (
          <motion.div
            key={idx}
            layout
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`h-10 w-full rounded border flex items-center justify-between px-3 font-mono text-micro shadow-sm ${
              idx === elements.length - 1
                ? "border-[#22C55E] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]"
            }`}
          >
            <span>[{idx}]</span>
            <strong className="text-caption truncate max-w-[80px]">
              {String(el)}
            </strong>
            {idx === elements.length - 1 && (
              <span className="text-[8px] font-bold text-[#22C55E] uppercase tracking-wider select-none">
                TOP
              </span>
            )}
          </motion.div>
        ))}

        {elements.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <span className="text-zinc-700 italic select-none font-mono text-micro">
              Stack Underflow / Empty
            </span>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

// ============================================================================
// 3. QUEUE VISUALIZER
// ============================================================================

function QueueVisualizer({ target }) {
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
          <Database className="h-4 w-4 text-[#22C55E]" />
          <span>
            Queue Line:{" "}
            <strong className="text-zinc-300">{elements.length} elements</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 p-2 border-y-2 border-[var(--color-border)] bg-[var(--color-surface-raised)]/30 rounded-sm min-w-[280px] justify-start">
        {elements.map((el, idx) => (
          <motion.div
            key={idx}
            layout
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className={`h-12 w-20 rounded border flex flex-col items-center justify-center font-mono text-[10px] relative shadow-sm ${
              idx === 0
                ? "border-[#22C55E] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : idx === elements.length - 1
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]"
            }`}
          >
            <span className="text-[8px] text-zinc-600 font-bold">[{idx}]</span>
            <strong className="text-micro truncate max-w-[64px] mt-0.5">
              {String(el)}
            </strong>

            {idx === 0 && (
              <span className="absolute -top-6 text-[8px] font-bold text-[#22C55E] tracking-wider uppercase select-none">
                FRONT
              </span>
            )}
            {idx === elements.length - 1 && (
              <span className="absolute -bottom-6 text-[8px] font-bold text-blue-400 tracking-wider uppercase select-none">
                REAR
              </span>
            )}
          </motion.div>
        ))}

        {elements.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <span className="text-zinc-700 italic select-none font-mono text-micro">
              Queue Empty
            </span>
          </div>
        )}
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
    const rootAddr = target.value.startsWith("0x")
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
