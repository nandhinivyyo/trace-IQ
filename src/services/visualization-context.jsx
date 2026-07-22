import { createContext, useContext, useState, useCallback } from "react";

const VisualizationContext = createContext(undefined);

export function VisualizationProvider({ children }) {
  const [zoom] = useState(1.0);
  const setZoom = useCallback(() => {}, []);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [activeVariable, setActiveVariable] = useState(null);

  const zoomIn = useCallback(() => {}, []);
  const zoomOut = useCallback(() => {}, []);

  const resetViewport = useCallback(() => {
    setPan({ x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback((bounds) => {
    if (!bounds) {
      setPan({ x: 0, y: 0 });
      return;
    }

    const boundsWidth = bounds.maxX - bounds.minX;
    const boundsHeight = bounds.maxY - bounds.minY;
    if (boundsWidth <= 0 || boundsHeight <= 0) return;

    const containerWidth = 800;
    const containerHeight = 500;
    const centerX = bounds.minX + boundsWidth / 2;
    const centerY = bounds.minY + boundsHeight / 2;

    setPan({
      x: containerWidth / 2 - centerX,
      y: containerHeight / 2 - centerY,
    });
  }, []);

  const panTo = useCallback((x, y) => {
    const containerWidth = 800;
    const containerHeight = 500;
    setPan({
      x: containerWidth / 2 - x,
      y: containerHeight / 2 - y,
    });
  }, []);

  return (
    <VisualizationContext.Provider
      value={{
        zoom,
        pan,
        isFullscreen,
        showMinimap,
        selectedNodeId,
        hoveredNodeId,
        activeVariable,
        zoomIn,
        zoomOut,
        resetViewport,
        fitToScreen,
        panTo,
        setPan,
        setZoom,
        setIsFullscreen,
        setShowMinimap,
        setSelectedNodeId,
        setHoveredNodeId,
        setActiveVariable,
      }}
    >
      {children}
    </VisualizationContext.Provider>
  );
}

export function useVisualization() {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error(
      "useVisualization must be used within a VisualizationProvider",
    );
  }
  return context;
}
