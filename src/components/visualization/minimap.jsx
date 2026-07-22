import { useVisualization } from "@/services/visualization-context";

export function Minimap() {
  const { zoom, pan } = useVisualization();

  // Minimap preview dimensions
  const miniWidth = 120;
  const miniHeight = 80;

  // Compute camera visible boundaries based on pan/zoom offsets.
  // We represent the canvas center coordinates in the minimap space.
  const scale = Math.max(0.1, Math.min(zoom, 4.0));
  const viewWidth = miniWidth / scale;
  const viewHeight = miniHeight / scale;
  // Calculate relative translations
  const viewX = Math.max(
    0,
    Math.min(miniWidth - viewWidth, miniWidth / 2 - pan.x / 15),
  );
  const viewY = Math.max(
    0,
    Math.min(miniHeight - viewHeight, miniHeight / 2 - pan.y / 15),
  );

  return (
    <div className="absolute bottom-4 right-4 z-10 w-[120px] h-[80px] bg-[#111111]/90 backdrop-blur border border-[#232323] rounded-[var(--radius-sm)] shadow-lg overflow-hidden select-none pointer-events-none">
      <div className="relative w-full h-full">
        {/* Wireframe Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(34,197,94,0.06)_1px,transparent_1px)] bg-[size:12px_12px]" />

        {/* Center Node Mock Indicator */}
        <div className="absolute top-[38px] left-[58px] h-1.5 w-1.5 rounded-full bg-[#22C55E]/50 animate-pulse" />

        {/* Active Viewport Frame */}
        <div
          style={{
            left: `${viewX}px`,
            top: `${viewY}px`,
            width: `${Math.max(16, viewWidth)}px`,
            height: `${Math.max(12, viewHeight)}px`,
            transition: "all 0.1s ease-out",
          }}
          className="absolute border border-zinc-400 bg-white/[0.03] rounded-sm pointer-events-none"
        />

        {/* HUD watermark */}
        <div className="absolute bottom-1 right-1.5 text-[8px] font-mono font-bold tracking-wider text-zinc-600 uppercase select-none">
          Map
        </div>
      </div>
    </div>
  );
}
