// Pure percent-rectangle geometry for hotspots. See HotspotBox in ./types:
// left/top/right are edge insets (right is NOT a width), all in % of the image.
import type { HotspotBox } from "./types";

export type { HotspotBox } from "./types";

export type Edge = "n" | "s" | "e" | "w";

/** Minimum box width/height, in %. Prevents invisible, unclickable hotspots. */
export const MIN_SIZE_PCT = 1;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export function pointerToPercent(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { xPct: number; yPct: number } {
  const xPct = rect.width > 0 ? clamp(((clientX - rect.left) / rect.width) * 100, 0, 100) : 0;
  const yPct = rect.height > 0 ? clamp(((clientY - rect.top) / rect.height) * 100, 0, 100) : 0;
  return { xPct, yPct };
}

export function boxFromPoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): HotspotBox {
  return {
    left: Math.min(x0, x1),
    right: 100 - Math.max(x0, x1),
    top: Math.min(y0, y1),
    height: Math.max(y0, y1) - Math.min(y0, y1),
  };
}

export function moveBox(box: HotspotBox, dxPct: number, dyPct: number): HotspotBox {
  const width = 100 - box.left - box.right;
  const newLeft = clamp(box.left + dxPct, 0, 100 - width);
  const newTop = clamp(box.top + dyPct, 0, 100 - box.height);
  return { left: newLeft, right: 100 - width - newLeft, top: newTop, height: box.height };
}

/** Drags one edge handle. Each edge maps to one field — the schema stores
    independent edges, not a width/height pair. */
export function resizeEdge(box: HotspotBox, edge: Edge, pct: number): HotspotBox {
  switch (edge) {
    case "w":
      return { ...box, left: clamp(pct, 0, 100 - box.right - MIN_SIZE_PCT) };
    case "e":
      return { ...box, right: clamp(100 - pct, 0, 100 - box.left - MIN_SIZE_PCT) };
    case "s":
      return { ...box, height: clamp(pct - box.top, MIN_SIZE_PCT, 100 - box.top) };
    case "n": {
      const bottom = box.top + box.height;
      const top = clamp(pct, 0, bottom - MIN_SIZE_PCT);
      return { ...box, top, height: bottom - top };
    }
  }
}

/** The one place a percent box becomes CSS positioning: the reader's hotspot
    and the Studio's editor box must position identically, or they drift. */
export function boxToStyle(box: HotspotBox) {
  return {
    left: `${box.left}%`,
    right: `${box.right}%`,
    top: `${box.top}%`,
    height: `${box.height}%`,
  } as const;
}
