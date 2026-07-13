"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import {
  moveBox,
  pointerToPercent,
  resizeEdge,
  type Edge,
  type HotspotBoxValue,
} from "./hotspotMath";

type DragState =
  | { mode: "move"; startX: number; startY: number; startBox: HotspotBoxValue }
  | { mode: "resize"; edge: Edge };

const EDGES: { edge: Edge; style: React.CSSProperties; cursor: string }[] = [
  { edge: "n", style: { top: -4, left: 0, right: 0, height: 8 }, cursor: "ns-resize" },
  { edge: "s", style: { bottom: -4, left: 0, right: 0, height: 8 }, cursor: "ns-resize" },
  { edge: "w", style: { left: -4, top: 0, bottom: 0, width: 8 }, cursor: "ew-resize" },
  { edge: "e", style: { right: -4, top: 0, bottom: 0, width: 8 }, cursor: "ew-resize" },
];

/**
 * One draggable/resizable overlay rectangle on the hotspot canvas. Drag state
 * is kept local (not pushed to Sanity) until pointerup, so a drag gesture
 * never floods the form's patch channel with intermediate patches.
 */
export function HotspotBox({
  box,
  label,
  selected,
  containerRef,
  onCommit,
  onSelect,
}: {
  box: HotspotBoxValue;
  label?: string;
  selected: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onCommit: (box: HotspotBoxValue) => void;
  onSelect: () => void;
}) {
  const [live, setLive] = useState<HotspotBoxValue | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const current = live ?? box;

  const getRect = useCallback(() => containerRef.current?.getBoundingClientRect(), [containerRef]);

  const beginDrag = useCallback(
    (e: React.PointerEvent, state: DragState) => {
      e.stopPropagation();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      dragRef.current = state;
      setLive(box);
      onSelect();
    },
    [box, onSelect],
  );

  const handleMovePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = getRect();
      if (!rect) return;
      const { xPct, yPct } = pointerToPercent(e.clientX, e.clientY, rect);
      beginDrag(e, { mode: "move", startX: xPct, startY: yPct, startBox: box });
    },
    [beginDrag, box, getRect],
  );

  const handleResizePointerDown = useCallback(
    (edge: Edge) => (e: React.PointerEvent) => {
      beginDrag(e, { mode: "resize", edge });
    },
    [beginDrag],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = getRect();
      if (!rect) return;
      const { xPct, yPct } = pointerToPercent(e.clientX, e.clientY, rect);
      if (drag.mode === "move") {
        setLive(moveBox(drag.startBox, xPct - drag.startX, yPct - drag.startY));
      } else {
        const pct = drag.edge === "n" || drag.edge === "s" ? yPct : xPct;
        setLive((prev) => resizeEdge(prev ?? box, drag.edge, pct));
      }
    },
    [box, getRect],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      const final = live;
      setLive(null);
      if (final) onCommit(final);
    },
    [live, onCommit],
  );

  return (
    <div
      onPointerDown={handleMovePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "absolute",
        left: `${current.left}%`,
        right: `${current.right}%`,
        top: `${current.top}%`,
        height: `${current.height}%`,
        boxSizing: "border-box",
        border: selected ? "2px solid #e8623c" : "2px dashed rgba(232, 98, 60, 0.7)",
        background: selected ? "rgba(232, 98, 60, 0.22)" : "rgba(232, 98, 60, 0.12)",
        cursor: "move",
        touchAction: "none",
      }}
    >
      {label !== undefined && (
        <span
          style={{
            position: "absolute",
            top: -20,
            left: 0,
            fontSize: 11,
            lineHeight: "18px",
            padding: "0 4px",
            background: "#e8623c",
            color: "#fff",
            whiteSpace: "nowrap",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            pointerEvents: "none",
          }}
        >
          {label || "(untitled link)"}
        </span>
      )}
      {EDGES.map(({ edge, style, cursor }) => (
        <div
          key={edge}
          onPointerDown={handleResizePointerDown(edge)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: "absolute",
            ...style,
            cursor,
            touchAction: "none",
          }}
        />
      ))}
    </div>
  );
}
