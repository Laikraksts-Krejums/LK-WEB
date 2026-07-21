"use client";

import { useCallback, useRef, useState } from "react";
import { r2PublicUrl } from "@/lib/r2";
import { HotspotBox } from "./HotspotBox";
import {
  boxFromPoints,
  boxToStyle,
  pointerToPercent,
  MIN_SIZE_PCT,
  type HotspotBox as HotspotBoxValue,
} from "@/domain/box";

export type CanvasHotspot = HotspotBoxValue & { _key: string; label?: string };

const DRAW_THRESHOLD_PX = 6;

/* Fixed height: a landscape and a portrait page occupy the same vertical space,
   so paging between them never moves the controls below the canvas. */
const CANVAS_HEIGHT = "70vh";

type DrawState = {
  startClientX: number;
  startClientY: number;
  drawing: boolean;
  x0: number;
  y0: number;
};

/** The wrapper is inline-block with no explicit size, so it hugs the image's
    rendered box — keeping containerRef's rect a valid coordinate space for drawing. */
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
      // Read `draft` directly, not in a setDraft updater: StrictMode may invoke
      // updaters twice, which would fire onCreate — a real patch — twice.
      if (state?.drawing && draft) {
        const width = 100 - draft.left - draft.right;
        if (width >= MIN_SIZE_PCT && draft.height >= MIN_SIZE_PCT) {
          onCreate(draft);
        }
      }
      setDraft(null);
    },
    [draft, onCreate],
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        // `center`, not the default `stretch`: the container must keep hugging
        // the image for its bounding rect to stay a valid coordinate space.
        alignItems: "center",
        height: CANVAS_HEIGHT,
      }}
    >
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
            maxHeight: CANVAS_HEIGHT,
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
              ...boxToStyle(draft),
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
