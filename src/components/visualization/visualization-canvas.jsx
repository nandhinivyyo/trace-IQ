import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { motion, useMotionValue } from "framer-motion";
import { useVisualization } from "@/services/visualization-context";
import { usePlayback } from "@/services/playback-store";
import { rendererManager } from "@/services/renderer-manager";
import { Box, HelpCircle, Layers, Database, Maximize2, Minimize2 } from "lucide-react";

export function VisualizationCanvas() {
  const {
    zoom,
    pan,
    setPan,
    setZoom,
    selectedNodeId,
    setSelectedNodeId,
    activeVariable,
    setActiveVariable,
    showMinimap,
    isFullscreen,
    setIsFullscreen,
  } = useVisualization();

  const { traces, currentStepIdx, playbackSpeed, complexity } = usePlayback();
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);
  const [manualRendererId, setManualRendererId] = useState(null);
  const [connections, setConnections] = useState([]);

  // Motion values to keep framer-motion drag fully aligned
  const xMotion = useMotionValue(pan.x);
  const yMotion = useMotionValue(pan.y);

  // Sync state values when pan changes programmatically (like fitToScreen/panTo)
  useEffect(() => {
    xMotion.set(pan.x);
    yMotion.set(pan.y);
  }, [pan, xMotion, yMotion]);

  // Translate mouse wheel delta to canvas pan offsets (scrolling)
  const handleWheel = (e) => {
    if (!isFullscreen) return; // Disable scroll panning in static mode
    e.preventDefault();
    setPan((prev) => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY,
    }));
  };

  // Canvas background click clears selections
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget || e.target.id === "grid-bg") {
      setSelectedNodeId(null);
      setActiveVariable(null);
    }
  };

  const hasTraces = traces.length > 0 && currentStepIdx !== -1;
  const currentStep = hasTraces ? traces[currentStepIdx] : null;

  // Compile active frames from call stack
  const frames = useMemo(() => {
    if (!currentStep) return [];
    if (currentStep.functionStack && currentStep.functionStack.length > 0) {
      return currentStep.functionStack;
    }
    // Fallback: mock a frame using currentFunction
    return [
      {
        currentFunction: currentStep.currentFunction || "main",
        parentFunction: "global",
        callDepth: 1,
        returnLine: 0,
      },
    ];
  }, [currentStep]);

  // Reconstruct frame variables list (caching historical state)
  const getFrameVariables = useCallback(
    (frameName, depth) => {
      if (!currentStep) return [];
      // Top-most active frame: use current step variables
      if (depth === 0) {
        return (currentStep.variablesAfter || []).filter(
          (v) => v.name !== "args" && v.scope !== "heap",
        );
      }

      // Inactive parent frames: search backwards
      for (let i = currentStepIdx - 1; i >= 0; i--) {
        const step = traces[i];
        if (step.currentFunction === frameName) {
          return (step.variablesAfter || []).filter(
            (v) => v.name !== "args" && v.scope !== "heap",
          );
        }
      }
      // Fallback: search anywhere in trace list
      const anyMatch = traces.find(
        (step) => step.currentFunction === frameName,
      );
      if (anyMatch) {
        return (anyMatch.variablesAfter || []).filter(
          (v) => v.name !== "args" && v.scope !== "heap",
        );
      }
      return [];
    },
    [traces, currentStep, currentStepIdx],
  );

  // Compute pointer connections coordinates
  useEffect(() => {
    if (!currentStep) {
      setConnections([]);
      return;
    }

    const updateConnections = () => {
      if (!workspaceRef.current) return;
      const workspaceRect = workspaceRef.current.getBoundingClientRect();
      const conns = [];

      // Find all elements matching ptr-dot-*
      const dots = document.querySelectorAll("[id^='ptr-dot-']");
      const targetEl =
        document.getElementById("heap-object-array-grid") ||
        document.getElementById("heap-object-matrix-grid") ||
        document.getElementById("heap-object-visualizer-container");

      if (targetEl) {
        const tgtRect = targetEl.getBoundingClientRect();
        // Point to middle-left edge of the target object
        const x2 = (tgtRect.left - workspaceRect.left) / (isFullscreen ? zoom : 1.0);
        const y2 =
          ((tgtRect.top + tgtRect.bottom) / 2 - workspaceRect.top) / (isFullscreen ? zoom : 1.0);

        dots.forEach((dot) => {
          const srcRect = dot.getBoundingClientRect();
          const x1 =
            ((srcRect.left + srcRect.right) / 2 - workspaceRect.left) / (isFullscreen ? zoom : 1.0);
          const y1 =
            ((srcRect.top + srcRect.bottom) / 2 - workspaceRect.top) / (isFullscreen ? zoom : 1.0);

          conns.push({ x1, y1, x2, y2 });
        });
      }

      setConnections(conns);
    };

    updateConnections();
    const timer = setTimeout(updateConnections, 100);

    return () => clearTimeout(timer);
  }, [currentStep, currentStepIdx, zoom, activeVariable, isFullscreen]);

  // Compute smooth bezier curved path
  const getBezierPath = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1);
    const cx1 = x1 + dx * 0.4;
    const cy1 = y1;
    const cx2 = x2 - dx * 0.4;
    const cy2 = y2;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  // Get all supporting renderers for current step trace variables signature
  const supportingRenderers = useMemo(() => {
    if (!currentStep) return [];
    return rendererManager.getSupportingRenderers(currentStep);
  }, [currentStep]);

  // Determine active renderer based on manual switch overrides
  const activeRenderer = useMemo(() => {
    if (!currentStep) return null;
    if (manualRendererId) {
      const match = supportingRenderers.find((r) => r.id === manualRendererId);
      if (match) return match;
    }
    return rendererManager.getBestRenderer(currentStep);
  }, [currentStep, manualRendererId, supportingRenderers]);

  // Reset manual renderer selections on timeline index updates
  useEffect(() => {
    setManualRendererId(null);
  }, [currentStepIdx]);

  const canvasClassName = isFullscreen
    ? "fixed inset-0 w-screen h-screen z-[9999] bg-[var(--color-canvas)] overflow-hidden select-none flex flex-col"
    : "relative flex-1 h-full w-full bg-[var(--color-canvas)] overflow-hidden select-none border border-[var(--color-border)] rounded-[var(--radius-sm)]";

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onClick={handleBackgroundClick}
      className={canvasClassName}
    >
      {/* Background Dots Grid Pattern */}
      <svg
        id="grid-bg"
        className="absolute inset-0 h-full w-full opacity-[0.03] pointer-events-none"
      >
        <defs>
          <pattern
            id="dot-pattern"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          >
            <circle cx="2" cy="2" r="1.5" fill="#22C55E" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-pattern)" />
      </svg>

      {/* Top Header Bar */}
      {currentStep && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md px-4 py-2 text-micro font-sans h-12">
          {/* Left section: Active Visualizer info */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5 select-none pointer-events-none font-mono">
              <div className="flex items-center gap-1 text-[9px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                <Layers className="h-3 w-3 text-[#22C55E]" />
                <span>Active Visualizer</span>
              </div>
              <span className="text-caption font-bold text-[var(--color-text-primary)] whitespace-nowrap">
                {activeRenderer
                  ? activeRenderer.name
                  : "None (No compatible structure)"}
              </span>
            </div>

            {activeRenderer && activeRenderer.renderHeader && (
              <div className="h-6 w-px bg-[#232323]" />
            )}
          </div>

          {/* Right section: Header, Zoom Controls & Fullscreen toggle */}
          <div className="flex-1 flex items-center justify-end gap-4 ml-4">
            {activeRenderer && activeRenderer.renderHeader && (
              <div className="flex-1 flex items-center justify-between">
                {activeRenderer.renderHeader({
                  step: currentStep,
                  activeVariable,
                  onSelectVariable: setActiveVariable,
                })}
              </div>
            )}

            {/* Inline Zoom Controls inside Gutter header during fullscreen */}
            {isFullscreen && (
              <div className="flex items-center gap-1.5 border border-[#232323] bg-[#111111] px-1.5 py-0.5 rounded select-none">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  className="h-6 w-6 rounded hover:bg-[#161616] flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer text-[12px] font-bold"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="text-[10px] text-zinc-500 font-mono w-10 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
                  className="h-6 w-6 rounded hover:bg-[#161616] flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer text-[12px] font-bold"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            )}

            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="h-8 w-8 rounded border border-[#232323] bg-[#161616] flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#22C55E]/50 transition-all cursor-pointer shrink-0"
              title={isFullscreen ? "Exit Fullscreen" : "Maximize Visualization"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4.5 w-4.5" />
              ) : (
                <Maximize2 className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Render Workspace canvas */}
      {hasTraces && currentStep ? (
        <motion.div
          drag={isFullscreen}
          dragMomentum={false}
          style={isFullscreen ? { x: xMotion, y: yMotion } : { x: 0, y: 0 }}
          onDrag={(_, info) => {
            if (isFullscreen) {
              setPan({ x: pan.x + info.delta.x, y: pan.y + info.delta.y });
            }
          }}
          className="absolute inset-0 h-full w-full origin-top-left"
        >
          <div
            ref={workspaceRef}
            style={{
              transform: isFullscreen ? `scale(${zoom})` : "scale(1.0)",
              transformOrigin: "0 0",
            }}
            className="flex items-start gap-12 p-8 pt-16 min-h-full select-none relative w-full"
          >
            {/* 1. Call Stack Frame panel (Left Column) */}
            <div className="flex flex-col gap-6 w-[220px] shrink-0">
              <div className="text-micro font-bold text-zinc-500 uppercase tracking-wider select-none font-mono flex items-center gap-1.5 border-b border-[var(--color-border)] pb-2">
                <Layers className="h-4 w-4 text-[#22C55E]" />
                <span>Frames (Call Stack)</span>
              </div>

              <div className="flex flex-col gap-4">
                {frames.map((frame, depth) => {
                  const frameVars = getFrameVariables(frame.currentFunction, depth);
                  return (
                    <div
                      key={depth}
                      className={`border rounded-lg bg-[var(--color-surface-raised)]/85 backdrop-blur-md overflow-hidden transition-all duration-300 shadow-xl ${
                        depth === 0
                          ? "border-[#22C55E] ring-1 ring-[#22C55E]/30"
                          : "border-[var(--color-border)]"
                      }`}
                    >
                      {/* Frame Header */}
                      <div
                        className={`px-3 py-2 font-mono flex justify-between items-center ${
                          depth === 0 ? "bg-[var(--color-accent-subtle)]" : "bg-[var(--color-surface-elevated)]"
                        }`}
                      >
                        <span
                          className={`text-[12px] font-bold ${
                            depth === 0 ? "text-[var(--color-accent-text)]" : "text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {frame.currentFunction}
                        </span>
                        {frame.returnLine > 0 && (
                          <span className="text-[9px] text-zinc-500">
                            line {frame.returnLine}
                          </span>
                        )}
                      </div>

                      {/* Local Variables Grid */}
                      <div className="p-3">
                        <table className="w-full text-left border-collapse font-mono text-[11px] text-zinc-400">
                          <tbody>
                            {frameVars.map((v) => {
                              const isRef =
                                v.datatype.toLowerCase().includes("list") ||
                                v.datatype.toLowerCase().includes("array") ||
                                v.datatype.includes("[]") ||
                                v.referenceType;
                              return (
                                <tr
                                    key={v.name}
                                    className="border-b border-[var(--color-border-subtle)] last:border-b-0"
                                  >
                                    <td className="py-2 pr-4 font-bold text-zinc-400 truncate max-w-[100px] select-text">
                                      {v.name}
                                    </td>
                                    <td className="py-2 pl-2 border-l border-[var(--color-border)]/80 relative min-w-[80px]">
                                    {isRef ? (
                                      <div
                                        id={`ptr-dot-${frame.currentFunction}-${v.name}`}
                                        className="w-3.5 h-3.5 rounded-full border-2 border-[#22C55E] bg-[var(--color-canvas)] hover:bg-[#22C55E]/20 cursor-pointer flex items-center justify-center transition-all mx-auto"
                                        title="Points to Heap Object"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                                      </div>
                                    ) : (
                                      <span
                                        className="text-[var(--color-text-primary)] truncate max-w-[100px] block select-text font-bold"
                                        title={v.value}
                                      >
                                        {v.value}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {frameVars.length === 0 && (
                              <tr>
                                <td
                                  colSpan={2}
                                  className="py-1 text-zinc-700 italic text-[10px]"
                                >
                                  no local variables
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 min-w-0">
              <div className="text-micro font-bold text-zinc-500 uppercase tracking-wider select-none font-mono flex items-center gap-1.5 border-b border-[var(--color-border)] pb-2">
                <Database className="h-4 w-4 text-[#22C55E]" />
                <span>Heap Objects</span>
              </div>

              <div
                id="heap-object-visualizer-container"
                className="relative flex items-center justify-center p-6 bg-[var(--color-surface)]/40 border border-[var(--color-border)] rounded-xl shadow-2xl min-h-[300px] w-full"
              >
                {activeRenderer ? (
                  activeRenderer.render({
                    step: currentStep,
                    zoom,
                    pan,
                    selectedNodeId,
                    onSelectNode: setSelectedNodeId,
                    activeVariable,
                    onSelectVariable: setActiveVariable,
                    animationSpeed: playbackSpeed,
                  })
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center text-zinc-600 max-w-sm select-none">
                    <Box className="h-10 w-10 text-zinc-700 stroke-[1.5]" />
                    <h4 className="text-caption font-bold text-zinc-500">
                      Object Standby
                    </h4>
                    <p className="text-micro">
                      Scope variables are primitive values. No reference objects to display.
                    </p>
                  </div>
                )}
              </div>
              
              {complexity && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-emerald-500/20 bg-[#111111]/90 backdrop-blur-md rounded-xl flex items-center justify-between shadow-lg select-text font-mono shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 border border-emerald-500/20 rounded font-bold uppercase tracking-wider">
                      Analysis
                    </span>
                    <span className="text-[11px] font-bold text-zinc-300">
                      Complexity Evaluation
                    </span>
                  </div>
                  <div className="flex gap-4 text-micro">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">Time:</span>
                      <strong className="text-emerald-400 font-bold bg-[#161616] px-2 py-0.5 border border-[#232323] rounded">
                        {complexity.timeComplexity}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">Space:</span>
                      <strong className="text-emerald-400 font-bold bg-[#161616] px-2 py-0.5 border border-[#232323] rounded">
                        {complexity.spaceComplexity}
                      </strong>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 3. Reference Arrow Connectors (SVG overlay layer) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#22C55E" />
                </marker>
              </defs>

              {connections.map((conn, idx) => (
                <path
                  key={idx}
                  d={getBezierPath(conn.x1, conn.y1, conn.x2, conn.y2)}
                  stroke="#22C55E"
                  strokeWidth={1.8}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className="opacity-80"
                />
              ))}
            </svg>
          </div>
        </motion.div>
      ) : (
        /* Empty / Initial state */
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[var(--color-text-tertiary)] p-6 select-none font-sans">
          <HelpCircle className="h-12 w-12 mb-3 text-[var(--color-accent)] animate-pulse opacity-40" />
          <h3 className="text-body font-bold text-[var(--color-text-primary)]">
            Canvas Visualizer Standby
          </h3>
          <p className="text-caption max-w-[280px] mt-1.5 leading-relaxed">
            Run compilation or execution traces to display runtime data
            structures and call frames.
          </p>
        </div>
      )}
    </div>
  );
}
