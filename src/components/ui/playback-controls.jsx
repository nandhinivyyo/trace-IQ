import { usePlayback } from "@/services/playback-store";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

export function PlaybackControls() {
  const {
    traces,
    currentStepIdx,
    isPlaying,
    playbackSpeed,
    nextStep,
    prevStep,
    jumpToStep,
    togglePlay,
    setPlaybackSpeed,
    restart,
  } = usePlayback();

  if (traces.length === 0) return null;

  const totalSteps = traces.length;
  const currentStepNum = currentStepIdx + 1;

  return (
    <div className="flex flex-col gap-2.5 bg-[#161616] border border-[#232323] rounded-[var(--radius-sm)] p-3 select-none select-none">
      {/* Slider & Progress bar */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-micro font-mono text-[var(--color-text-tertiary)] min-w-[32px]">
          {String(currentStepNum).padStart(2, "0")}
        </span>

        <input
          type="range"
          min="0"
          max={totalSteps - 1}
          value={currentStepIdx}
          onChange={(e) => jumpToStep(parseInt(e.target.value))}
          className="flex-1 h-1.5 appearance-none rounded-full bg-[#232323] accent-[#22C55E] cursor-pointer focus:outline-none"
        />

        <span className="text-micro font-mono text-[var(--color-text-tertiary)] min-w-[32px] text-right">
          {String(totalSteps).padStart(2, "0")}
        </span>
      </div>

      {/* Control Buttons Group */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Restart */}
          <button
            onClick={restart}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#111111] text-[var(--color-text-secondary)] hover:bg-[#1c1d21] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
            title="Restart Execution"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Prev step */}
          <button
            onClick={prevStep}
            disabled={currentStepIdx <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#111111] text-[var(--color-text-secondary)] hover:bg-[#1c1d21] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Previous Step"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="flex h-8 px-3 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[#22C55E] text-black font-bold text-caption hover:bg-[#2fd66d] cursor-pointer transition-all shadow-[0_0_10px_rgba(34,197,94,0.15)]"
            title={isPlaying ? "Pause autoplay" : "Start autoplay"}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-black text-black" />
                <span className="text-micro">Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-black text-black" />
                <span className="text-micro">Play</span>
              </>
            )}
          </button>

          {/* Next step */}
          <button
            onClick={nextStep}
            disabled={currentStepIdx >= totalSteps - 1}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[#232323] bg-[#111111] text-[var(--color-text-secondary)] hover:bg-[#1c1d21] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Next Step"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <span className="text-micro font-mono text-[var(--color-text-tertiary)]">
            Speed
          </span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="h-8 rounded-[var(--radius-sm)] border border-[#232323] bg-[#111111] px-2 text-caption font-semibold text-[var(--color-text-secondary)] hover:border-[#35363c] focus:outline-none cursor-pointer"
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="2">2.0x</option>
            <option value="4">4.0x</option>
            <option value="8">8.0x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
