import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { usePlayback } from "@/services/playback-store";
import {
  ZoomIn,
  ZoomOut,
  Star,
  Database,
  AlertCircle,
  Clock,
  GitCommit,
} from "lucide-react";

export function ReplayTimeline() {
  const { traces, currentStepIdx, jumpToStep, bookmarks, toggleBookmark } =
    usePlayback();

  const containerRef = useRef(null);
  const scrollTrackRef = useRef(null);
  // UI parameters
  const [zoom, setZoom] = useState(3); // zoom factor: 1 to 10
  const stepWidth = useMemo(() => zoom * 12, [zoom]); // width per step in pixels
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const startPanX = useRef(0);
  const startScrollLeft = useRef(0);

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    setContainerWidth(containerRef.current.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Update scroll left on wheel or scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollLeft(containerRef.current.scrollLeft);
    }
  }, []);

  // Sync scroll position when current step changes to keep playhead in view
  useEffect(() => {
    if (!containerRef.current || isDraggingPlayhead) return;
    const playheadPos = currentStepIdx * stepWidth;
    const leftBound = containerRef.current.scrollLeft + 60;
    const rightBound = containerRef.current.scrollLeft + containerWidth - 60;

    if (playheadPos < leftBound || playheadPos > rightBound) {
      containerRef.current.scrollTo({
        left: Math.max(0, playheadPos - containerWidth / 2),
        behavior: "smooth",
      });
    }
  }, [currentStepIdx, stepWidth, containerWidth, isDraggingPlayhead]);

  // Compute visible index range
  const { startIdx, endIdx } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollLeft / stepWidth) - 5);
    const end = Math.min(
      traces.length - 1,
      Math.ceil((scrollLeft + containerWidth) / stepWidth) + 5,
    );
    return { startIdx: start, endIdx: end };
  }, [scrollLeft, containerWidth, stepWidth, traces.length]);

  // Extract function stack active span bars
  const functionSpans = useMemo(() => {
    const spans = [];
    if (traces.length === 0) return spans;

    const activeFunctions = {};
    traces.forEach((step, idx) => {
      const stack = step.functionStack || [];
      // Update function stacks
      stack.forEach((frame) => {
        const key = `${frame.currentFunction}_depth_${frame.callDepth}`;
        if (activeFunctions[key] === undefined) {
          activeFunctions[key] = { start: idx, depth: frame.callDepth };
        }
      });

      // Check which functions in active list are NOT in the stack anymore
      Object.keys(activeFunctions).forEach((key) => {
        const active = activeFunctions[key];
        const stillInStack = stack.some(
          (frame) =>
            `${frame.currentFunction}_depth_${frame.callDepth}` === key,
        );
        // If not in stack or it's the last step
        if (!stillInStack || idx === traces.length - 1) {
          spans.push({
            name: key.split("_depth_")[0],
            start: active.start,
            end: idx,
            depth: active.depth,
          });
          delete activeFunctions[key];
        }
      });
    });

    return spans;
  }, [traces]);

  // Extract loop scopes and iteration spans
  const loopSpans = useMemo(() => {
    const spans = [];
    if (traces.length === 0) return spans;

    let activeLoop = null;

    traces.forEach((step, idx) => {
      const loop = step.loopInformation;
      if (loop) {
        if (!activeLoop || activeLoop.iteration !== loop.iterationNumber) {
          if (activeLoop) {
            spans.push({ ...activeLoop, end: idx - 1 });
          }
          activeLoop = {
            type: loop.loopType || "Loop",
            iteration: loop.iterationNumber,
            start: idx,
          };
        }
      } else {
        if (activeLoop) {
          spans.push({ ...activeLoop, end: idx - 1 });
          activeLoop = null;
        }
      }

      if (idx === traces.length - 1 && activeLoop) {
        spans.push({ ...activeLoop, end: idx });
      }
    });

    return spans;
  }, [traces]);

  // Check memory allocation events
  const memoryEvents = useMemo(() => {
    const events = [];
    if (traces.length === 0) return events;

    traces.forEach((step, idx) => {
      const prevStep = idx > 0 ? traces[idx - 1] : null;
      const currentVars = step.variablesAfter || [];
      const prevVars = prevStep?.variablesAfter || [];

      // Detect Heap References addition
      const currentHeapRefs = currentVars
        .filter((v) => v.referenceType)
        .map((v) => v.memoryAddress);
      const prevHeapRefs = prevVars
        .filter((v) => v.referenceType)
        .map((v) => v.memoryAddress);

      currentHeapRefs.forEach((ref) => {
        if (!prevHeapRefs.includes(ref) && ref !== "0x0" && ref !== "null") {
          events.push({ stepIdx: idx, label: `Alloc ${ref}`, type: "alloc" });
        }
      });

      prevHeapRefs.forEach((ref) => {
        if (!currentHeapRefs.includes(ref) && ref !== "0x0" && ref !== "null") {
          events.push({ stepIdx: idx, label: `Free ${ref}`, type: "free" });
        }
      });
    });

    return events;
  }, [traces]);

  // Jump helpers
  const handleJumpToBookmark = () => {
    const nextBookmark = bookmarks.find((b) => b.stepIdx > currentStepIdx);
    if (nextBookmark) {
      jumpToStep(nextBookmark.stepIdx);
    } else if (bookmarks.length > 0) {
      jumpToStep(bookmarks[0].stepIdx);
    }
  };

  // Convert click coordinates to step index
  const handleTimelineClick = (e) => {
    if (!scrollTrackRef.current || isPanning) return;
    const rect = scrollTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const step = Math.round(clickX / stepWidth);
    const clampedStep = Math.min(traces.length - 1, Math.max(0, step));
    jumpToStep(clampedStep);
  };

  // Playhead dragging
  const handlePlayheadMouseDown = (e) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  };

  const handleTimelineMouseMove = (e) => {
    if (isDraggingPlayhead && scrollTrackRef.current) {
      const rect = scrollTrackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const step = Math.round(clickX / stepWidth);
      const clampedStep = Math.min(traces.length - 1, Math.max(0, step));
      jumpToStep(clampedStep);
    } else if (isPanning && containerRef.current) {
      const deltaX = e.clientX - startPanX.current;
      containerRef.current.scrollLeft = startScrollLeft.current - deltaX;
    }
  };

  const handleTimelineMouseUpOrLeave = () => {
    setIsDraggingPlayhead(false);
    setIsPanning(false);
  };

  // Middle-click or Alt-click to pan timeline
  const handleTimelineMouseDown = (e) => {
    if (e.button === 1 || e.altKey) {
      e.preventDefault();
      setIsPanning(true);
      startPanX.current = e.clientX;
      if (containerRef.current) {
        startScrollLeft.current = containerRef.current.scrollLeft;
      }
    }
  };

  // Double click timeline to add a custom bookmark
  const handleTimelineDoubleClick = (e) => {
    if (!scrollTrackRef.current) return;
    const rect = scrollTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const step = Math.round(clickX / stepWidth);
    const clampedStep = Math.min(traces.length - 1, Math.max(0, step));
    toggleBookmark(clampedStep, "custom", `Bookmark Step ${clampedStep + 1}`);
  };

  // Zoom helpers
  const zoomIn = () => setZoom((prev) => Math.min(prev + 1, 10));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 1, 1));

  // Determine current active algorithm/file from first step
  const activeAlgorithm = traces[0]?.currentFunction || "main";

  return (
    <div className="flex flex-col h-full bg-[#111111] text-[var(--color-text-secondary)] font-sans border-t border-[#232323]">
      {/* Timeline Controls Toolbar */}
      <div className="flex items-center justify-between border-b border-[#232323] px-3.5 py-2 bg-[#161616]/80 text-micro">
        {/* Left: Metadata details */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[var(--color-text-primary)] font-bold">
            <Clock className="h-3.5 w-3.5 text-[#22C55E]" />
            <span>Execution Tracks</span>
          </span>
          <div className="h-3 w-px bg-[#232323]" />
          <span className="text-zinc-500 font-mono">
            Algorithm:{" "}
            <strong className="text-zinc-300">{activeAlgorithm}</strong>
          </span>
          <div className="h-3 w-px bg-[#232323]" />
          <span className="text-zinc-500 font-mono">
            Step:{" "}
            <strong className="text-[#22C55E]">
              {currentStepIdx + 1}/{traces.length}
            </strong>
          </span>
        </div>

        {/* Right: Zoom controls and Jump helpers */}
        <div className="flex items-center gap-2">
          {/* Quick jumps */}
          <button
            onClick={handleJumpToBookmark}
            disabled={bookmarks.length === 0}
            className="flex h-7 items-center gap-1 rounded border border-[#232323] bg-[#0B0B0B] px-2.5 text-[11px] font-bold text-zinc-500 hover:text-[var(--color-text-primary)] hover:border-zinc-700 disabled:opacity-30 cursor-pointer"
            title="Jump to Next Bookmark"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="hidden sm:inline">Jump Bookmark</span>
          </button>

          <div className="h-3 w-px bg-[#232323]" />

          {/* Zoom Buttons */}
          <div className="flex items-center border border-[#232323] bg-[#0B0B0B] rounded overflow-hidden">
            <button
              onClick={zoomOut}
              disabled={zoom === 1}
              className="flex h-7 w-7 items-center justify-center text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 text-[9px] font-mono text-zinc-500">
              {zoom}x
            </span>
            <button
              onClick={zoomIn}
              disabled={zoom === 10}
              className="flex h-7 w-7 items-center justify-center text-zinc-500 hover:text-white disabled:opacity-20 cursor-pointer"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Scroll Workspace */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onMouseMove={handleTimelineMouseMove}
        onMouseUp={handleTimelineMouseUpOrLeave}
        onMouseLeave={handleTimelineMouseUpOrLeave}
        onMouseDown={handleTimelineMouseDown}
        className="flex-1 overflow-x-auto overflow-y-hidden select-none scrollbar-thin relative cursor-crosshair bg-[#0B0B0B]"
        style={{ scrollBehavior: "auto" }}
      >
        <div
          ref={scrollTrackRef}
          onClick={handleTimelineClick}
          onDoubleClick={handleTimelineDoubleClick}
          className="h-full relative py-2"
          style={{ width: `${traces.length * stepWidth + 200}px` }}
        >
          {/* TRACK 1: Ruler & Playhead Handle */}
          <div className="h-8 border-b border-[#232323]/50 relative">
            {/* Virtualized tick lines */}
            {Array.from({ length: endIdx - startIdx + 1 }).map((_, i) => {
              const idx = startIdx + i;
              const xPos = idx * stepWidth;
              const isMajor = idx % 10 === 0 || idx === 0;

              return (
                <div
                  key={idx}
                  className="absolute bottom-0 flex flex-col items-center pointer-events-none"
                  style={{ left: `${xPos}px` }}
                >
                  {isMajor && (
                    <span className="text-[8px] font-mono text-zinc-600 mb-0.5">
                      {idx}
                    </span>
                  )}
                  <div
                    className={`w-[1px] bg-zinc-800 ${isMajor ? "h-3 bg-zinc-600" : "h-1.5"}`}
                  />
                </div>
              );
            })}
          </div>

          {/* TRACK 2: Bookmarks and Errors Mark Ribbon */}
          <div className="h-6 border-b border-[#232323]/30 relative flex items-center">
            <span className="absolute left-2 text-[8px] font-mono font-bold uppercase tracking-wider text-zinc-600 pointer-events-none">
              Events
            </span>
            {/* Bookmarks */}
            {bookmarks.map((b) => {
              if (b.stepIdx < startIdx || b.stepIdx > endIdx) return null;
              const xPos = b.stepIdx * stepWidth;

              return (
                <button
                  key={b.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToStep(b.stepIdx);
                  }}
                  className="absolute z-10 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500 hover:bg-amber-500 text-amber-500 hover:text-black cursor-pointer shadow-md shadow-amber-500/10 transition-all"
                  style={{ left: `${xPos - 8}px` }}
                  title={`${b.label} (${b.category})`}
                >
                  <Star className="h-2.5 w-2.5 fill-current" />
                </button>
              );
            })}

            {/* Error Steps */}
            {traces.map((step, idx) => {
              if (idx < startIdx || idx > endIdx) return null;
              if (step.executionStatus !== "ERROR") return null;
              const xPos = idx * stepWidth;

              return (
                <div
                  key={`err-${idx}`}
                  className="absolute z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-950 border border-red-500 text-red-500 shadow-md shadow-red-500/20"
                  style={{ left: `${xPos - 8}px` }}
                  title="Runtime Error Detected at Step"
                >
                  <AlertCircle className="h-2.5 w-2.5" />
                </div>
              );
            })}

            {/* Memory events */}
            {memoryEvents.map((evt, i) => {
              if (evt.stepIdx < startIdx || evt.stepIdx > endIdx) return null;
              const xPos = evt.stepIdx * stepWidth;

              return (
                <div
                  key={`mem-evt-${i}`}
                  className={`absolute z-10 flex h-3.5 w-3.5 items-center justify-center rounded border text-[8px] font-bold ${
                    evt.type === "alloc"
                      ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                      : "bg-zinc-900 border-zinc-500 text-zinc-400"
                  }`}
                  style={{ left: `${xPos - 7}px` }}
                  title={evt.label}
                >
                  <Database className="h-2 w-2" />
                </div>
              );
            })}
          </div>

          {/* TRACK 3: Function Frame Flame chart spans */}
          <div className="h-14 border-b border-[#232323]/30 relative">
            <span className="absolute left-2 top-1.5 text-[8px] font-mono font-bold uppercase tracking-wider text-zinc-600 pointer-events-none">
              Function Stack
            </span>
            {functionSpans.map((span, idx) => {
              // check overlap
              if (span.end < startIdx || span.start > endIdx) return null;
              const left = span.start * stepWidth;
              const width = Math.max(
                stepWidth,
                (span.end - span.start + 1) * stepWidth,
              );
              const top = 14 + span.depth * 14;

              // Color based on call depth
              const colorClasses = [
                "bg-[#10243c] border-blue-500/50 text-blue-300",
                "bg-[#1e143c] border-purple-500/50 text-purple-300",
                "bg-[#32121f] border-rose-500/50 text-rose-300",
                "bg-[#12321f] border-emerald-500/50 text-emerald-300",
              ][span.depth % 4];

              return (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToStep(span.start);
                  }}
                  className={`absolute h-3 flex items-center px-1 rounded-sm border text-[8px] font-mono font-bold truncate cursor-pointer hover:brightness-125 transition-all ${colorClasses}`}
                  style={{
                    left: `${left}px`,
                    width: `${width - 2}px`,
                    top: `${top}px`,
                  }}
                  title={`Function: ${span.name} (Steps ${span.start + 1} - ${span.end + 1})`}
                >
                  {span.name}
                </div>
              );
            })}
          </div>

          {/* TRACK 4: Loops & Iterations */}
          <div className="h-10 relative">
            <span className="absolute left-2 top-1 text-[8px] font-mono font-bold uppercase tracking-wider text-zinc-600 pointer-events-none">
              Loops & Iterations
            </span>
            {loopSpans.map((span, idx) => {
              if (span.end < startIdx || span.start > endIdx) return null;
              const left = span.start * stepWidth;
              const width = Math.max(
                stepWidth,
                (span.end - span.start + 1) * stepWidth,
              );

              return (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToStep(span.start);
                  }}
                  className="absolute h-4 flex items-center px-1 rounded border border-[#22C55E]/40 bg-[#12321f]/35 text-[#22C55E] text-[8px] font-mono font-bold truncate cursor-pointer hover:brightness-125 transition-all"
                  style={{
                    left: `${left}px`,
                    width: `${width - 2}px`,
                    top: "14px",
                  }}
                  title={`${span.type} - Iteration ${span.iteration}`}
                >
                  {span.type} #{span.iteration}
                </div>
              );
            })}
          </div>

          {/* DRAGGABLE PLAYHEAD LINE OVERLAY */}
          {currentStepIdx >= 0 && (
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: `${currentStepIdx * stepWidth}px` }}
            >
              {/* Playhead line */}
              <div className="w-[1.5px] bg-[#22C55E] h-full absolute" />

              {/* Playhead visual handle */}
              <div
                onMouseDown={handlePlayheadMouseDown}
                className="h-4 w-4 bg-[#22C55E] hover:bg-[#2fd66d] border border-black shadow rounded-sm flex items-center justify-center -translate-x-1/2 absolute cursor-ew-resize pointer-events-auto"
                style={{ top: "18px" }}
              >
                <GitCommit className="h-2.5 w-2.5 text-black" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
