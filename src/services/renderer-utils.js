/**
 * Computes boundary intersection points between two nodes
 * so arrows stop precisely at node margins.
 */
export function getArrowPoints(
  source,
  target,
  sourceRadius = 24,
  targetRadius = 24,
) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return { start: source, end: target };
  }

  // Unit vectors
  const ux = dx / distance;
  const uy = dy / distance;

  return {
    start: {
      x: source.x + ux * sourceRadius,
      y: source.y + uy * sourceRadius,
    },
    end: {
      x: target.x - ux * targetRadius,
      y: target.y - uy * targetRadius,
    },
  };
}

/**
 * Returns circular layout coordinates for a list of items.
 */
export function getCircularLayout(
  count,
  centerX = 400,
  centerY = 250,
  radius = 160,
) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2; // Offset by 90deg to start top center
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return points;
}

/**
 * Returns tree level hierarchy layout coordinates.
 */
export function getTreeLayout(
  _nodeId,
  level = 0,
  positionIndex = 0,
  parentX = 400,
  levelHeight = 80,
  _siblingSpacing = 90,
) {
  // Center is parentX, horizontal offset scales per depth level
  const levelSpacings = [220, 110, 55, 28];
  const spacing = levelSpacings[Math.min(level, levelSpacings.length - 1)];
  return {
    x: parentX + positionIndex * spacing,
    y: 100 + level * levelHeight,
  };
}

/**
 * Generates an SVG cubic bezier path string for curved connectors.
 */
export function getCurvedPath(start, end, curveFactor = 40) {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  // Perpendicular offset vector for curvature control
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  const px = -dy / len;
  const py = dx / len;
  const ctrlX = midX + px * curveFactor;
  const ctrlY = midY + py * curveFactor;

  return `M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`;
}

/**
 * Safely parses string representations of arrays, lists, tuples, or matrices
 * (including Python lists with True/False values and single quotes).
 */
export function parseArrayValue(valStr) {
  if (!valStr) return null;
  const cleanedStr = valStr.trim();
  if (!cleanedStr) return null;

  try {
    // If it's a bracketed list
    let cleaned = cleanedStr;
    if (cleaned.startsWith("(")) {
      cleaned = "[" + cleaned.slice(1, -1) + "]";
    }
    // Replace boolean structures
    cleaned = cleaned
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null");
    // Replace single quotes with double quotes
    cleaned = cleaned.replace(/'/g, '"');

    // Remove trailing commas to prevent JSON.parse syntax errors
    cleaned = cleaned.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');

    // Attempt standard JSON parse
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch (e) {
    // If it's a comma-separated list without brackets
    if (cleanedStr.includes(",")) {
      try {
        const parsed = JSON.parse("[" + cleanedStr + "]");
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        // Fallback split
        return cleanedStr.split(",").map((s) => {
          const trimmed = s.trim();
          // parse numbers if numeric
          if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
          if (trimmed === "true" || trimmed === "True") return true;
          if (trimmed === "false" || trimmed === "False") return false;
          return trimmed.replace(/^["']|["']$/g, "");
        });
      }
    }
    return null;
  }
}

/**
 * Computes memory offset coordinates for simulated addresses.
 */
export function getElementAddress(baseAddress, index, sizeBytes = 4) {
  if (!baseAddress || baseAddress === "0x0" || baseAddress === "null") {
    // Generate a consistent dummy address from base seed
    const seed = 0x7ffd5680;
    return "0x" + (seed + index * sizeBytes).toString(16);
  }
  try {
    const cleanAddress = baseAddress.replace(/^0x/i, "");
    const numeric = parseInt(cleanAddress, 16);
    if (isNaN(numeric)) {
      return baseAddress + "+" + index * sizeBytes;
    }
    return "0x" + (numeric + index * sizeBytes).toString(16);
  } catch (e) {
    return baseAddress + "+" + index * sizeBytes;
  }
}
