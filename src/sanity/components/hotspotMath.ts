/**
 * Pure geometry for the hotspot canvas. No React/Sanity imports so the math
 * is easy to reason about (and could be unit tested) independent of pointer
 * event wiring.
 *
 * A box mirrors hotspot.ts's own fields: `left`/`top` are insets from the
 * left/top edge, `right` is an inset from the *right* edge (not a width),
 * `height` is the box's height. Width in % is always `100 - left - right`.
 * All values are percentages of the page image, 0-100.
 */

export type HotspotBoxValue = {
  left: number;
  right: number;
  top: number;
  height: number;
};

export type Edge = "n" | "s" | "e" | "w";

/** Minimum box width/height, in %. Prevents invisible, unclickable hotspots. */
export const MIN_SIZE_PCT = 1;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** Converts a pointer's client position into a percentage within `rect`. */
export function pointerToPercent(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { xPct: number; yPct: number } {
  const xPct = rect.width > 0 ? clamp(((clientX - rect.left) / rect.width) * 100, 0, 100) : 0;
  const yPct = rect.height > 0 ? clamp(((clientY - rect.top) / rect.height) * 100, 0, 100) : 0;
  return { xPct, yPct };
}

/** Builds a box from two drag corners, in percent. */
export function boxFromPoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): HotspotBoxValue {
  const left = Math.min(x0, x1);
  const right = 100 - Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const height = Math.max(y0, y1) - Math.min(y0, y1);
  return { left, right, top, height };
}

/** Translates a box by a pointer delta (in percent), keeping its size fixed. */
export function moveBox(
  box: HotspotBoxValue,
  dxPct: number,
  dyPct: number,
): HotspotBoxValue {
  const width = 100 - box.left - box.right;
  const newLeft = clamp(box.left + dxPct, 0, 100 - width);
  const newTop = clamp(box.top + dyPct, 0, 100 - box.height);
  return {
    left: newLeft,
    right: 100 - width - newLeft,
    top: newTop,
    height: box.height,
  };
}

/** Drags a single edge handle. Each edge maps to one field, since the schema
 * stores independent edges rather than a width/height pair. */
export function resizeEdge(
  box: HotspotBoxValue,
  edge: Edge,
  pct: number,
  minSize = MIN_SIZE_PCT,
): HotspotBoxValue {
  switch (edge) {
    case "w": {
      const left = clamp(pct, 0, 100 - box.right - minSize);
      return { ...box, left };
    }
    case "e": {
      const right = clamp(100 - pct, 0, 100 - box.left - minSize);
      return { ...box, right };
    }
    case "s": {
      const height = clamp(pct - box.top, minSize, 100 - box.top);
      return { ...box, height };
    }
    case "n": {
      const bottom = box.top + box.height;
      const top = clamp(pct, 0, bottom - minSize);
      return { ...box, top, height: bottom - top };
    }
  }
}
