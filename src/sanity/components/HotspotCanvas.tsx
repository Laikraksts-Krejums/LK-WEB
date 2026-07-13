"use client";

import { useCallback, useRef, useState } from "react";
import { r2PublicUrl } from "@/lib/r2";
import { HotspotBox } from "./HotspotBox";
import {
  boxFromPoints,
  pointerToPercent,
  MIN_SIZE_PCT,
  type HotspotBoxValue,
} from "./hotspotMath";

export type CanvasHotspot = HotspotBoxValue & { _key: string; label?: string };

const DRAW_THRESHOLD_PX = 6;

type DrawState = {
  startClientX: number;
  startClientY: number;
  drawing: boolean;
  x0: number;
  y0: number;
};

/**
 * The page image with its hotspots drawn on top. The wrapping div is
 * `display: inline-block` with no explicit size, so it shrinks to exactly
 * the image's rendered box — that's what makes `containerRef`'s bounding
 * rect a reliable coordinate space for both the boxes and new-box drawing,
 * with no letterboxing gap to account for.
 */
export function HotspotCanvas({
  page,
  hotspots,
  onCreate,
  onUpdate,
}: {
  page: { key: string; width?: number; height?: number };
  hotspots: CanvasHotspot[];
  onCreate: (box: HotspotBoxValue) => void;
  onUpdate: (key: string, box: HotspotBoxValue) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<HotspotBoxValue | null>(null);
  const drawRef = useRef<DrawState | null>(null);

  const handleBackgroundPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const { xPct, yPct } = pointerToPercent(e.clientX, e.clientY, rect);
    drawRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      drawing: false,
      x0: xPct,
      y0: yPct,
    };
  }, []);

  const handleBackgroundPointerMove = useCallback((e: React.PointerEvent) => {
    const state = drawRef.current;
    if (!state) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (!state.drawing) {
      const dx = e.clientX - state.startClientX;
      const dy = e.clientY - state.startClientY;
      if (Math.hypot(dx, dy) < DRAW_THRESHOLD_PX) return;
      state.drawing = true;
    }
    const { xPct, yPct } = pointerToPercent(e.clientX, e.clientY, rect);
    setDraft(boxFromPoints(state.x0, state.y0, xPct, yPct));
  }, []);

  const handleBackgroundPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const state = drawRef.current;
      drawRef.current = null;
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      if (!state?.drawing) {
        setDraft(null);
        return;
      }
      setDraft((current) => {
        if (current) {
          const width = 100 - current.left - current.right;
          if (width >= MIN_SIZE_PCT && current.height >= MIN_SIZE_PCT) {
            onCreate(current);
          }
        }
        return null;
      });
    },
    [onCreate],
  );

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        ref={containerRef}
        onPointerDown={handleBackgroundPointerDown}
        onPointerMove={handleBackgroundPointerMove}
        onPointerUp={handleBackgroundPointerUp}
        style={{
          position: "relative",
          display: "inline-block",
          maxWidth: "100%",
          cursor: "crosshair",
          touchAction: "none",
          lineHeight: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r2PublicUrl(page.key)}
          width={page.width}
          height={page.height}
          alt=""
          draggable={false}
          style={{
            display: "block",
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: "70vh",
            pointerEvents: "none",
          }}
        />
        {hotspots.map((h) => (
          <HotspotBox
            key={h._key}
            box={h}
            label={h.label}
            selected={selectedKey === h._key}
            containerRef={containerRef}
            onSelect={() => setSelectedKey(h._key)}
            onCommit={(box) => onUpdate(h._key, box)}
          />
        ))}
        {draft && (
          <div
            style={{
              position: "absolute",
              left: `${draft.left}%`,
              right: `${draft.right}%`,
              top: `${draft.top}%`,
              height: `${draft.height}%`,
              boxSizing: "border-box",
              border: "2px dashed #2276fc",
              background: "rgba(34, 118, 252, 0.15)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
