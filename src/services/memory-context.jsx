import React, { createContext, useContext, useState, useCallback } from "react";

const MemoryContext = createContext(undefined);

export function MemoryProvider({ children }) {
  const [coordinates, setCoordinates] = useState({});
  const [hoveredAddress, setHoveredAddress] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedFrameId, setSelectedFrameId] = useState(null);

  const registerCoordinate = useCallback((key, coord) => {
    setTimeout(() => {
      setCoordinates((prev) => {
        if (coord === null) {
          if (!(key in prev)) return prev;
          const copy = { ...prev };
          delete copy[key];
          return copy;
        }
        // Check if coordinate matches exactly to prevent rendering loop updates
        const existing = prev[key];
        if (
          existing &&
          existing.x === coord.x &&
          existing.y === coord.y &&
          existing.width === coord.width &&
          existing.height === coord.height
        ) {
          return prev;
        }
        return { ...prev, [key]: coord };
      });
    }, 0);
  }, []);

  return (
    <MemoryContext.Provider
      value={{
        coordinates,
        registerCoordinate,
        hoveredAddress,
        setHoveredAddress,
        selectedAddress,
        setSelectedAddress,
        selectedFrameId,
        setSelectedFrameId,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error("useMemory must be used within a MemoryProvider");
  }
  return context;
}
