import { useVisualization } from "@/services/visualization-context";
import {
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  Map,
  MapPinOff,
} from "lucide-react";

export function ZoomControls() {
  const {
    zoom,
    zoomIn,
    zoomOut,
    resetViewport,
    fitToScreen,
    isFullscreen,
    setIsFullscreen,
    showMinimap,
    setShowMinimap,
  } = useVisualization();

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleFit = () => {
    // Fits standard dummy boundaries centered in standard viewport
    fitToScreen({ minX: 100, maxX: 700, minY: 100, maxY: 400 });
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-[#161616]/95 backdrop-blur border border-[#232323] p-1.5 rounded-[var(--radius-sm)] shadow-lg select-none">
      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        className="flex h-7 w-7 items-center justify-center rounded bg-[#111111] text-[var(--color-text-secondary)] border border-[#232323]/50 hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
        title="Zoom Out"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      {/* Zoom percentage */}
      <span className="text-micro font-mono text-[var(--color-text-secondary)] min-w-[36px] text-center px-1 font-semibold">
        {Math.round(zoom * 100)}%
      </span>

      {/* Zoom In */}
      <button
        onClick={zoomIn}
        className="flex h-7 w-7 items-center justify-center rounded bg-[#111111] text-[var(--color-text-secondary)] border border-[#232323]/50 hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
        title="Zoom In"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-[#232323] mx-0.5" />

      {/* Reset */}
      <button
        onClick={resetViewport}
        className="flex h-7 w-7 items-center justify-center rounded bg-[#111111] text-[var(--color-text-secondary)] border border-[#232323]/50 hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
        title="Reset Camera Viewport"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>

      {/* Fit to Screen */}
      <button
        onClick={handleFit}
        className="flex h-7 px-2 items-center justify-center gap-1 rounded bg-[#111111] text-[var(--color-text-secondary)] border border-[#232323]/50 hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer text-micro font-semibold transition-colors"
        title="Center Data Structure View"
      >
        Fit
      </button>

      <div className="h-4 w-px bg-[#232323] mx-0.5" />

      {/* Toggle Minimap */}
      <button
        onClick={() => setShowMinimap(!showMinimap)}
        className={`flex h-7 w-7 items-center justify-center rounded border transition-colors cursor-pointer ${
          showMinimap
            ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
            : "bg-[#111111] border-[#232323]/50 text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)]"
        }`}
        title="Toggle Mini Map preview"
      >
        {showMinimap ? (
          <Map className="h-3.5 w-3.5" />
        ) : (
          <MapPinOff className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Fullscreen */}
      <button
        onClick={handleFullscreenToggle}
        className={`flex h-7 w-7 items-center justify-center rounded border transition-colors cursor-pointer ${
          isFullscreen
            ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
            : "bg-[#111111] border-[#232323]/50 text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)]"
        }`}
        title="Toggle Fullscreen Canvas"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
