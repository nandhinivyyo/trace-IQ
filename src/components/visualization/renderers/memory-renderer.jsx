import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MemoryProvider, useMemory } from "@/services/memory-context";
import { parseArrayValue } from "@/services/renderer-utils";
import { Database, FolderHeart, Activity, Layers, Layout } from "lucide-react";

// Standard Memory Visualizer Renderer Definition
export const MemoryRenderer = {
  id: "memory-renderer",
  name: "Stack & Heap Memory",

  supports(step) {
    // Matches if step has function call recursion stack or object reference addresses
    const vars = step.variablesAfter || [];
    const hasStack = step.functionStack && step.functionStack.length > 0;
    const hasHeap = vars.some(
      (v) => v.referenceType && v.memoryAddress !== "0x0",
    );
    return hasStack || hasHeap;
  },

  getPriority() {
    return 30; // Priority above general layouts
  },

  render(props) {
    return (
      <MemoryProvider>
        <MemoryVisualizer {...props} />
      </MemoryProvider>
    );
  },
};

function MemoryVisualizer(props) {
  const { step } = props;
  const {
    coordinates,
    hoveredAddress,
    setHoveredAddress,
    selectedAddress,
    setSelectedAddress,
  } = useMemory();

  // Coordinates container ref for relative overlay arrow rendering
  const containerRef = useRef(null);

  // Group variables by scope
  const { stackVariables, heapObjects } = useMemo(() => {
    const vars = step.variablesAfter || [];
    const stackVars = vars.filter(
      (v) => !v.referenceType || v.scope !== "heap",
    );
    // Group heap allocations
    const heapObjs = vars.filter(
      (v) =>
        v.referenceType &&
        v.memoryAddress !== "0x0" &&
        v.memoryAddress !== "null",
    );
    return {
      stackVariables: stackVars,
      heapObjects: heapObjs,
    };
  }, [step.variablesAfter]);

  // Max call depth metric
  const maxStackDepth = useMemo(() => {
    if (!step.functionStack) return 1;
    return Math.max(...step.functionStack.map((f) => f.callDepth), 1);
  }, [step.functionStack]);

  // References count calculations (inbound pointer tracking)
  const inboundRefs = useMemo(() => {
    const counts = {};
    const vars = step.variablesAfter || [];
    vars.forEach((v) => {
      // 1. Stack references
      if (v.referenceType && v.value.startsWith("0x")) {
        counts[v.value] = (counts[v.value] || 0) + 1;
      }
      // 2. Heap fields references
      if (v.referenceType && v.value.startsWith("{")) {
        try {
          const fields = JSON.parse(v.value.replace(/'/g, '"'));
          Object.values(fields).forEach((val) => {
            if (typeof val === "string" && val.startsWith("0x")) {
              counts[val] = (counts[val] || 0) + 1;
            }
          });
        } catch (e) {}
      }
    });
    return counts;
  }, [step.variablesAfter]);

  // Track coordinates of registered elements relative to container
  const [svgArrows, setSvgArrows] = useState([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const parentRect = containerRef.current.getBoundingClientRect();
    const arrows = [];

    // Draw stack-to-heap pointers
    stackVariables.forEach((v) => {
      if (v.value.startsWith("0x")) {
        const fromKey = `stack-var-${v.name}`;
        const toKey = `heap-obj-${v.value}`;
        const fromCoord = coordinates[fromKey];
        const toCoord = coordinates[toKey];

        if (fromCoord && toCoord) {
          arrows.push({
            id: `${v.name}-${v.value}`,
            from: {
              x: fromCoord.x + (fromCoord.width || 0) - parentRect.left,
              y: fromCoord.y + (fromCoord.height || 0) / 2 - parentRect.top,
            },
            to: {
              x: toCoord.x - parentRect.left,
              y: toCoord.y + 25 - parentRect.top, // Align slightly down on heap card
            },
            label: v.name,
            active: hoveredAddress === v.value || selectedAddress === v.value,
          });
        }
      }
    });

    // Draw heap-to-heap child pointers (e.g. left/right links in trees)
    heapObjects.forEach((obj) => {
      if (obj.value.startsWith("{")) {
        try {
          const fields = JSON.parse(obj.value.replace(/'/g, '"'));
          Object.entries(fields).forEach(([fieldName, fieldValue]) => {
            if (
              typeof fieldValue === "string" &&
              fieldValue.startsWith("0x") &&
              fieldValue !== "0x0" &&
              fieldValue !== "null"
            ) {
              const fromKey = `heap-field-${obj.memoryAddress}-${fieldName}`;
              const toKey = `heap-obj-${fieldValue}`;

              const fromCoord = coordinates[fromKey];
              const toCoord = coordinates[toKey];

              if (fromCoord && toCoord) {
                arrows.push({
                  id: `${obj.memoryAddress}-${fieldName}-${fieldValue}`,
                  from: {
                    x: fromCoord.x + (fromCoord.width || 0) - parentRect.left,
                    y:
                      fromCoord.y +
                      (fromCoord.height || 0) / 2 -
                      parentRect.top,
                  },
                  to: {
                    x: toCoord.x - parentRect.left,
                    y: toCoord.y + 35 - parentRect.top,
                  },
                  label: fieldName,
                  active:
                    hoveredAddress === fieldValue ||
                    selectedAddress === fieldValue ||
                    hoveredAddress === obj.memoryAddress,
                });
              }
            }
          });
        } catch (e) {}
      }
    });

    setSvgArrows(arrows);
  }, [
    coordinates,
    stackVariables,
    heapObjects,
    hoveredAddress,
    selectedAddress,
  ]);

  // Staggered Heap drag offsets
  const [heapPositions, setHeapPositions] = useState({});
  const handleHeapDrag = (addr, info) => {
    setHeapPositions((prev) => ({
      ...prev,
      [addr]: {
        x: (prev[addr]?.x || 0) + info.delta.x,
        y: (prev[addr]?.y || 0) + info.delta.y,
      },
    }));
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col w-full h-full bg-[#0B0B0B] border border-[#232323] overflow-hidden rounded-[var(--radius-md)] select-none text-[var(--color-text-secondary)]"
    >
      {/* 1. Header status bar */}
      <div className="flex items-center justify-between border-b border-[#232323] bg-[#111111]/70 px-4 py-2 text-micro shrink-0 font-sans">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[#22C55E]" />
          <span className="font-bold text-[var(--color-text-primary)]">
            Virtual Memory Space Engine
          </span>
        </div>
        <div className="flex items-center gap-4 text-zinc-500 font-mono">
          <span>Active Frames: {step.functionStack?.length || 1}</span>
          <span>Heap objects count: {heapObjects.length}</span>
        </div>
      </div>

      {/* 2. Stack and Heap Split Layout Workspace */}
      <div className="flex-1 min-h-0 flex relative w-full overflow-hidden p-6 gap-8 z-10">
        {/* Left Column: Stack Frames */}
        <div className="w-[380px] h-full flex flex-col gap-4 border-r border-[#232323]/50 pr-4 overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 pb-1 border-b border-[#232323] select-none">
            <Layers className="h-4 w-4 text-[#22C55E]" />
            <h3 className="text-caption font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Stack Memory
            </h3>
          </div>

          <div className="flex flex-col-reverse gap-4">
            {step.functionStack && step.functionStack.length > 0 ? (
              step.functionStack.map((frame) => (
                <StackFrameCard
                  key={`frame-${frame.callDepth}`}
                  frame={frame}
                  variables={stackVariables.filter(
                    (v) =>
                      v.scope === frame.currentFunction ||
                      (!v.scope && frame.callDepth === 1),
                  )}
                  isActive={frame.callDepth === step.functionStack.length}
                />
              ))
            ) : (
              <StackFrameCard
                key="frame-global"
                frame={{
                  currentFunction: "global",
                  callDepth: 1,
                  arguments: {},
                  returnLine: 0,
                }}
                variables={stackVariables}
                isActive={true}
              />
            )}
          </div>
        </div>

        {/* Right Column: Heap objects */}
        <div className="flex-1 h-full flex flex-col gap-4 overflow-y-auto scrollbar-thin relative p-2">
          <div className="flex items-center gap-1.5 pb-1 border-b border-[#232323] select-none shrink-0">
            <Layout className="h-4 w-4 text-[#22C55E]" />
            <h3 className="text-caption font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Heap Memory (Objects)
            </h3>
          </div>

          <div className="flex-1 relative min-h-0">
            {heapObjects.map((obj, index) => {
              const pos = heapPositions[obj.memoryAddress] || {
                x: 40 + (index % 2) * 220,
                y: 20 + Math.floor(index / 2) * 140,
              };
              const refCount = inboundRefs[obj.memoryAddress] || 0;
              const isHighlighted =
                hoveredAddress === obj.memoryAddress ||
                selectedAddress === obj.memoryAddress;

              return (
                <HeapObjectCard
                  key={`heap-${obj.memoryAddress}`}
                  obj={obj}
                  x={pos.x}
                  y={pos.y}
                  refCount={refCount}
                  isHighlighted={isHighlighted}
                  onDrag={(info) => handleHeapDrag(obj.memoryAddress, info)}
                  onHoverEnter={() => setHoveredAddress(obj.memoryAddress)}
                  onHoverLeave={() => setHoveredAddress(null)}
                  onClick={() =>
                    setSelectedAddress(
                      selectedAddress === obj.memoryAddress
                        ? null
                        : obj.memoryAddress,
                    )
                  }
                />
              );
            })}

            {heapObjects.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-1.5 text-center text-zinc-600 font-mono text-micro select-none">
                  <FolderHeart className="h-6 w-6 stroke-[1.5]" />
                  <span>No dynamic object allocations in Heap.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Absolute SVG connector arrows layer overlay */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#22C55E" />
            </marker>
          </defs>

          {svgArrows.map((arrow) => {
            const dx = arrow.to.x - arrow.from.x;
            const dy = arrow.to.y - arrow.from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            // Bezier control coordinate layout
            const midX = (arrow.from.x + arrow.to.x) / 2;
            const midY = (arrow.from.y + arrow.to.y) / 2;
            // Adjust offset to create curved paths
            const curveFactor = 25;
            const px = -dy / (len || 1);
            const py = dx / (len || 1);
            const ctrlX = midX + px * curveFactor;
            const ctrlY = midY + py * curveFactor;

            const pathStr = `M ${arrow.from.x} ${arrow.from.y} Q ${ctrlX} ${ctrlY} ${arrow.to.x} ${arrow.to.y}`;

            return (
              <g key={arrow.id} className="transition-all duration-200">
                {/* Glow under-path */}
                <path
                  d={pathStr}
                  fill="none"
                  stroke={arrow.active ? "#22C55E" : "rgba(34,197,94,0.1)"}
                  strokeWidth={arrow.active ? 4 : 2}
                  className="transition-all"
                />

                {/* Visual arrow path */}
                <path
                  d={pathStr}
                  fill="none"
                  stroke={arrow.active ? "#22C55E" : "rgba(34,197,94,0.4)"}
                  strokeWidth={1.5}
                  markerEnd="url(#arrow)"
                  strokeDasharray={arrow.active ? "4,4" : undefined}
                  className={arrow.active ? "stroke-dash-animation" : ""}
                />

                {/* Pointer name badge along bezier mid-point */}
                {arrow.active && (
                  <text
                    x={ctrlX}
                    y={ctrlY - 5}
                    fill="#22C55E"
                    fontSize="9px"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="bg-[#0B0B0B]"
                  >
                    {arrow.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. Bottom Panel: Memory Statistics Drawer */}
      <div className="border-t border-[#232323] bg-[#111111] px-4 py-2 flex items-center justify-between text-micro font-mono select-none shrink-0 text-zinc-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[#22C55E]" />
            <span>
              Virtual Stack Base:{" "}
              <strong className="text-zinc-400">0x1000</strong>
            </span>
          </div>
          <div className="h-4 w-px bg-[#232323]" />
          <span>
            Virtual Heap Base: <strong className="text-zinc-400">0x5000</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>
            Stack depth:{" "}
            <strong className="text-zinc-400">{maxStackDepth} frames</strong>
          </span>
          <span>
            Heap objects:{" "}
            <strong className="text-zinc-400">
              {heapObjects.length} active
            </strong>
          </span>
          <span>
            References:{" "}
            <strong className="text-zinc-400">{svgArrows.length} active</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STACK FRAME CARD SUBCOMPONENT
// ============================================================================

function StackFrameCard({ frame, variables, isActive }) {
  const {
    registerCoordinate,
    hoveredAddress,
    setHoveredAddress,
    selectedAddress,
    setSelectedAddress,
  } = useMemory();
  const frameRef = useRef(null);

  // Compute dummy virtual return address
  const returnAddress = useMemo(() => {
    return "0x" + (0x1000 + (frame.callDepth || 1) * 16).toString(16);
  }, [frame.callDepth]);

  return (
    <div
      ref={frameRef}
      className={`border rounded flex flex-col p-3 transition-all duration-200 ${
        isActive
          ? "border-[#22C55E] bg-[#161616]/40 shadow-[0_0_10px_rgba(34,197,94,0.05)]"
          : "border-[#232323] bg-[#111111]/40 opacity-70 hover:opacity-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232323] pb-1.5 mb-2 select-none">
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#22C55E] animate-pulse" : "bg-zinc-600"}`}
          />
          <span className="text-micro font-mono text-[var(--color-text-primary)]">
            {frame.currentFunction}()
          </span>
        </div>
        <span className="text-[8px] font-mono text-zinc-600">
          depth: {frame.callDepth || 1}
        </span>
      </div>

      {/* Frame details */}
      <div className="flex flex-col gap-1.5 font-mono text-micro text-zinc-400">
        <div className="flex justify-between select-none">
          <span className="text-zinc-600">Return Address:</span>
          <span className="text-zinc-500">{returnAddress}</span>
        </div>

        {frame.arguments && Object.keys(frame.arguments).length > 0 && (
          <div className="flex flex-col gap-0.5 border-t border-[#232323]/50 pt-1">
            <span className="text-[8px] font-bold text-zinc-600 uppercase select-none">
              Arguments
            </span>
            {Object.entries(frame.arguments).map(([name, val]) => (
              <div
                key={name}
                className="flex justify-between text-zinc-500 select-text"
              >
                <span>{name}:</span>
                <strong className="text-zinc-300 truncate max-w-[120px]">
                  {String(val)}
                </strong>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1 border-t border-[#232323]/50 pt-1.5">
          <span className="text-[8px] font-bold text-zinc-600 uppercase select-none">
            Local Variables
          </span>
          <div className="flex flex-col gap-1">
            {variables.map((v) => {
              const varKey = `stack-var-${v.name}`;
              const isPointer = v.value.startsWith("0x");
              const isSelected = selectedAddress === v.value;
              const isHovered = hoveredAddress === v.value;

              return (
                <div
                  key={v.name}
                  ref={(el) => {
                    if (el) {
                      const rect = el.getBoundingClientRect();
                      registerCoordinate(varKey, {
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height,
                      });
                    } else {
                      registerCoordinate(varKey, null);
                    }
                  }}
                  onMouseEnter={() => isPointer && setHoveredAddress(v.value)}
                  onMouseLeave={() => isPointer && setHoveredAddress(null)}
                  onClick={() =>
                    isPointer && setSelectedAddress(isSelected ? null : v.value)
                  }
                  className={`flex justify-between items-center px-1.5 py-0.5 rounded border transition-colors ${
                    isPointer
                      ? isSelected
                        ? "border-[#22C55E] bg-emerald-950/20 text-[#22C55E] cursor-pointer"
                        : isHovered
                          ? "border-emerald-500/50 bg-[#161616] text-[#22C55E] cursor-pointer"
                          : "border-[#232323] hover:border-emerald-500/30 bg-[#0B0B0B] cursor-pointer"
                      : "border-transparent text-zinc-400"
                  }`}
                >
                  <div className="flex gap-1 items-center">
                    <span className="text-zinc-500 text-[10px]">{v.name}</span>
                    <span className="text-[8px] text-zinc-700 bg-zinc-950 px-1 rounded select-none">
                      {v.datatype}
                    </span>
                  </div>
                  <strong className="text-zinc-300 truncate max-w-[140px] px-1 select-text">
                    {String(v.value)}
                  </strong>
                </div>
              );
            })}

            {variables.length === 0 && (
              <span className="text-zinc-700 italic select-none">
                No variables in scope
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HEAP OBJECT CARD SUBCOMPONENT
// ============================================================================

function HeapObjectCard({
  obj,
  x,
  y,
  refCount,
  isHighlighted,
  onDrag,
  onHoverEnter,
  onHoverLeave,
  onClick,
}) {
  const { registerCoordinate } = useMemory();

  // Parse object fields from value JSON
  const fields = useMemo(() => {
    if (obj.value.startsWith("{")) {
      try {
        const parsed = JSON.parse(obj.value.replace(/'/g, '"'));
        return Object.entries(parsed).map(([k, v]) => ({
          name: k,
          value: String(v),
        }));
      } catch (e) {}
    }
    if (obj.value.startsWith("[")) {
      try {
        const parsed = parseArrayValue(obj.value);
        if (Array.isArray(parsed)) {
          return parsed
            .slice(0, 4)
            .map((val, idx) => ({ name: `[${idx}]`, value: String(val) }));
        }
      } catch (e) {}
    }
    return [{ name: "value", value: obj.value }];
  }, [obj.value]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDrag={(_, info) => onDrag(info)}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      onClick={onClick}
      style={{ left: x, top: y }}
      className={`absolute w-44 rounded border flex flex-col p-2.5 bg-[#111111] cursor-grab active:cursor-grabbing select-none transition-colors z-10 ${
        isHighlighted
          ? "border-[#22C55E] shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-[#22C55E]/30"
          : "border-[#232323] shadow-md hover:border-zinc-700"
      }`}
      ref={(el) => {
        const key = `heap-obj-${obj.memoryAddress}`;
        if (el) {
          const rect = el.getBoundingClientRect();
          registerCoordinate(key, {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          });
        } else {
          registerCoordinate(key, null);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232323] pb-1 mb-1.5 select-none">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[var(--color-text-primary)] font-mono leading-none">
            {obj.datatype}
          </span>
          <span className="text-[8px] font-mono text-zinc-500 mt-0.5">
            {obj.memoryAddress}
          </span>
        </div>

        <span className="px-1 rounded bg-[#22C55E]/10 border border-[#22C55E]/20 text-[7px] font-bold text-[#22C55E] uppercase tracking-wide">
          refs: {refCount}
        </span>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-1 font-mono text-micro text-zinc-400 select-text">
        {fields.map((f) => {
          const fieldKey = `heap-field-${obj.memoryAddress}-${f.name}`;
          const isPointer = f.value.startsWith("0x");

          return (
            <div
              key={f.name}
              ref={(el) => {
                if (el) {
                  const rect = el.getBoundingClientRect();
                  registerCoordinate(fieldKey, {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                  });
                } else {
                  registerCoordinate(fieldKey, null);
                }
              }}
              className="flex justify-between items-center py-0.5 border-b border-zinc-900/50 last:border-0"
            >
              <span className="text-zinc-500 text-[10px]">{f.name}:</span>
              <strong
                className={`truncate max-w-[90px] px-1 ${isPointer ? "text-emerald-400 font-bold" : "text-zinc-300"}`}
              >
                {f.value}
              </strong>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
