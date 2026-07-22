"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const ZOOM_EPSILON = 1.001;
const TAP_SLOP = 12;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 30;
const VELOCITY_WINDOW_MS = 100;
const EDGE_TURN_PX = 72;
const EDGE_ZONE_FRACTION = 0.12;
const EDGE_ZONE_MIN = 56;
const EDGE_ZONE_MAX = 140;

type Options = {
  readerRef: RefObject<HTMLDivElement | null>;
  spreadRef: RefObject<HTMLDivElement | null>;
  zoomedClass: string;
  panningClass: string;
  hotspotClass: string;
  onNavigate: (delta: number, ms?: number) => void;
  onDragStart: () => void;
  onDragMove: (dx: number) => void;
  onDragEnd: (dx: number, width: number, velocity: number) => void;
  isMobile: boolean;
  enabled: boolean;
};

/** Imperative on purpose: per-frame transform writes, and native { passive: false }
    listeners — React's synthetic touchmove/wheel cannot preventDefault. */
export function useZoom({
  readerRef,
  spreadRef,
  zoomedClass,
  panningClass,
  hotspotClass,
  onNavigate,
  onDragStart,
  onDragMove,
  onDragEnd,
  isMobile,
  enabled,
}: Options) {
  const transform = useRef({ scale: 1, tx: 0, ty: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const zoomedRef = useRef(false);

  const navigateRef = useRef(onNavigate);
  const dragStartRef = useRef(onDragStart);
  const dragMoveRef = useRef(onDragMove);
  const dragEndRef = useRef(onDragEnd);
  const isMobileRef = useRef(isMobile);
  useEffect(() => {
    navigateRef.current = onNavigate;
  }, [onNavigate]);
  useEffect(() => {
    dragStartRef.current = onDragStart;
  }, [onDragStart]);
  useEffect(() => {
    dragMoveRef.current = onDragMove;
  }, [onDragMove]);
  useEffect(() => {
    dragEndRef.current = onDragEnd;
  }, [onDragEnd]);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  const clampPan = useCallback(() => {
    const spread = spreadRef.current;
    if (!spread) return;
    const t = transform.current;
    const maxX = Math.max(0, (spread.offsetWidth * (t.scale - 1)) / 2);
    const maxY = Math.max(0, (spread.offsetHeight * (t.scale - 1)) / 2);
    t.tx = Math.max(-maxX, Math.min(maxX, t.tx));
    t.ty = Math.max(-maxY, Math.min(maxY, t.ty));
  }, [spreadRef]);

  const applyTransform = useCallback(() => {
    const spread = spreadRef.current;
    const reader = readerRef.current;
    if (!spread || !reader) return;

    const { scale, tx, ty } = transform.current;
    spread.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;

    const zoomed = scale > ZOOM_EPSILON;
    reader.classList.toggle(zoomedClass, zoomed);
    if (zoomed !== zoomedRef.current) {
      zoomedRef.current = zoomed;
      setIsZoomed(zoomed);
    }
  }, [readerRef, spreadRef, zoomedClass]);

  const resetZoom = useCallback(() => {
    // Mutate in place — reassigning detaches every native listener from the live transform.
    const t = transform.current;
    t.scale = 1;
    t.tx = 0;
    t.ty = 0;

    const spread = spreadRef.current;
    const reader = readerRef.current;
    if (spread) spread.style.transform = "";
    if (reader) reader.classList.remove(zoomedClass);
    if (zoomedRef.current) {
      zoomedRef.current = false;
      setIsZoomed(false);
    }
  }, [readerRef, spreadRef, zoomedClass]);

  const zoomToward = useCallback(
    (targetScale: number, clientX: number, clientY: number) => {
      const spread = spreadRef.current;
      if (!spread) return;

      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScale));
      const rect = spread.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const t = transform.current;
      const s0 = t.scale;
      const offX = (clientX - centerX) / s0;
      const offY = (clientY - centerY) / s0;

      t.tx -= offX * (next - s0);
      t.ty -= offY * (next - s0);
      t.scale = next;

      if (t.scale <= ZOOM_EPSILON) {
        t.scale = 1;
        t.tx = 0;
        t.ty = 0;
      }

      clampPan();
      applyTransform();
    },
    [spreadRef, clampPan, applyTransform],
  );

  const zoomIn = useCallback(() => {
    const spread = spreadRef.current;
    if (!spread) return;
    const rect = spread.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    zoomToward(transform.current.scale + 1, cx, cy);
  }, [spreadRef, zoomToward]);

  const zoomOut = useCallback(() => {
    const spread = spreadRef.current;
    if (!spread) return;
    if (transform.current.scale - 1 <= MIN_SCALE) {
      resetZoom();
      return;
    }
    const rect = spread.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    zoomToward(transform.current.scale - 1, cx, cy);
  }, [spreadRef, resetZoom, zoomToward]);

  useEffect(() => {
    if (!enabled) return;
    const spread = spreadRef.current;
    const reader = readerRef.current;
    if (!spread || !reader) return;

    const t = transform.current;

    const dist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const mid = (a: Touch, b: Touch) => ({
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    });

    let wheelTimer: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      if (t.scale <= 1 && !e.ctrlKey) return;
      e.preventDefault();
      reader.classList.add(panningClass);
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomToward(t.scale * factor, e.clientX, e.clientY);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => reader.classList.remove(panningClass), 120);
    };

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (t.scale <= 1) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      reader.classList.add(panningClass);
      try {
        spread.setPointerCapture(e.pointerId);
      } catch {}
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      t.tx += e.clientX - lastX;
      t.ty += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      clampPan();
      applyTransform();
    };
    const endDrag = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      dragging = false;
      reader.classList.remove(panningClass);
    };

    let mode: "swipe" | "pan" | "pinch" | null = null;
    let startX = 0;
    let startY = 0;
    let touchLastX = 0;
    let touchLastY = 0;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    let swipeAxis: "h" | "v" | null = null;
    let samples: { x: number; t: number }[] = [];
    let edgeSpill = 0;
    let edgeTurned = false;

    const releaseVelocity = (endX: number, endT: number) => {
      const cutoff = endT - VELOCITY_WINDOW_MS;
      const first = samples.find((s) => s.t >= cutoff) ?? samples[0];
      if (!first) return 0;
      const dt = endT - first.t;
      return dt > 0 ? (endX - first.x) / dt : 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      edgeSpill = 0;
      edgeTurned = false;

      if (e.touches.length === 2) {
        mode = "pinch";
        pinchStartDist = dist(e.touches[0], e.touches[1]) || 1;
        pinchStartScale = t.scale;
        reader.classList.add(panningClass);
      } else if (e.touches.length === 1) {
        startX = touchLastX = e.touches[0].clientX;
        startY = touchLastY = e.touches[0].clientY;
        mode = t.scale > 1 ? "pan" : "swipe";
        swipeAxis = null;
        samples = [{ x: startX, t: performance.now() }];
        if (mode === "pan") reader.classList.add(panningClass);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (mode === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        const d = dist(e.touches[0], e.touches[1]);
        const m = mid(e.touches[0], e.touches[1]);
        zoomToward(pinchStartScale * (d / pinchStartDist), m.x, m.y);
        return;
      }

      if (mode === "pan" && e.touches.length === 1) {
        e.preventDefault();
        const stepX = e.touches[0].clientX - touchLastX;
        const txBefore = t.tx;

        t.tx += stepX;
        t.ty += e.touches[0].clientY - touchLastY;
        touchLastX = e.touches[0].clientX;
        touchLastY = e.touches[0].clientY;
        clampPan();
        applyTransform();

        // Drag the clamped pan could not absorb accumulates into a page turn.
        const spill = stepX - (t.tx - txBefore);
        if (spill * edgeSpill < 0) edgeSpill = 0;
        edgeSpill += spill;

        if (!edgeTurned && Math.abs(edgeSpill) > EDGE_TURN_PX) {
          edgeTurned = true;
          mode = null;
          reader.classList.remove(panningClass);
          navigateRef.current(edgeSpill < 0 ? 1 : -1);
        }
        return;
      }

      if (mode === "swipe" && e.touches.length === 1) {
        const x = e.touches[0].clientX;
        const dx = x - startX;
        const dy = e.touches[0].clientY - startY;

        if (swipeAxis === null && Math.hypot(dx, dy) > TAP_SLOP) {
          swipeAxis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
          if (swipeAxis === "h") dragStartRef.current();
        }

        if (swipeAxis === "h") {
          e.preventDefault();
          samples.push({ x, t: performance.now() });
          if (samples.length > 8) samples.shift();
          dragMoveRef.current(dx);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const ct = e.changedTouches[0];
      const endX = ct ? ct.clientX : startX;
      const endY = ct ? ct.clientY : startY;
      const moved = Math.abs(endX - startX) + Math.abs(endY - startY);

      const isDoubleTap = () => {
        const now = Date.now();
        const quick = now - lastTapTime < DOUBLE_TAP_MS;
        const near =
          Math.abs(endX - lastTapX) < DOUBLE_TAP_SLOP &&
          Math.abs(endY - lastTapY) < DOUBLE_TAP_SLOP;
        if (quick && near) {
          lastTapTime = 0;
          return true;
        }
        lastTapTime = now;
        lastTapX = endX;
        lastTapY = endY;
        return false;
      };

      if (mode === "swipe") {
        if (swipeAxis === "h") {
          dragEndRef.current(
            endX - startX,
            spread.offsetWidth,
            releaseVelocity(endX, performance.now()),
          );
        } else if (moved < TAP_SLOP && isDoubleTap()) {
          zoomToward(DOUBLE_TAP_SCALE, endX, endY);
        }
        swipeAxis = null;
      } else if (mode === "pan" && moved < TAP_SLOP && isDoubleTap()) {
        resetZoom();
      }

      if (e.touches.length === 0) {
        reader.classList.remove(panningClass);
        mode = t.scale > 1 ? "pan" : null;
      } else if (e.touches.length === 1 && t.scale > 1) {
        mode = "pan";
        startX = touchLastX = e.touches[0].clientX;
        startY = touchLastY = e.touches[0].clientY;
      }
    };

    const edgeAt = (clientX: number): -1 | 0 | 1 => {
      const rect = spread.getBoundingClientRect();
      const zone = Math.min(
        EDGE_ZONE_MAX,
        Math.max(EDGE_ZONE_MIN, rect.width * EDGE_ZONE_FRACTION),
      );
      if (clientX - rect.left < zone) return -1;
      if (rect.right - clientX < zone) return 1;
      return 0;
    };

    // data-edge, not a class — React owns className on the spread.
    let edgeHover: -1 | 0 | 1 = 0;
    const setEdgeHover = (dir: -1 | 0 | 1) => {
      if (dir === edgeHover) return;
      edgeHover = dir;
      if (dir === 0) spread.removeAttribute("data-edge");
      else spread.setAttribute("data-edge", dir < 0 ? "prev" : "next");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isMobileRef.current || t.scale > 1) {
        setEdgeHover(0);
        return;
      }
      setEdgeHover(edgeAt(e.clientX));
    };
    const onMouseLeave = () => setEdgeHover(0);

    const onClick = (e: MouseEvent) => {
      if (isMobileRef.current) return;
      if (t.scale > 1) return;
      if ((e.target as Element).closest(`.${hotspotClass}`)) return;
      const dir = edgeAt(e.clientX);
      if (dir !== 0) navigateRef.current(dir);
    };

    let onScreen = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.25 },
    );
    io.observe(reader);

    const onKeyDown = (e: KeyboardEvent) => {
      if (!onScreen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateRef.current(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateRef.current(1);
      }
    };

    spread.addEventListener("wheel", onWheel, { passive: false });
    spread.addEventListener("pointerdown", onPointerDown);
    spread.addEventListener("pointermove", onPointerMove);
    spread.addEventListener("pointerup", endDrag);
    spread.addEventListener("pointercancel", endDrag);
    spread.addEventListener("touchstart", onTouchStart, { passive: true });
    spread.addEventListener("touchmove", onTouchMove, { passive: false });
    spread.addEventListener("touchend", onTouchEnd, { passive: true });
    spread.addEventListener("mousemove", onMouseMove);
    spread.addEventListener("mouseleave", onMouseLeave);
    spread.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);

    // Symmetric teardown: StrictMode double-mounts, and a leaked listener turns two pages.
    return () => {
      clearTimeout(wheelTimer);
      io.disconnect();
      spread.removeAttribute("data-edge");
      spread.removeEventListener("wheel", onWheel);
      spread.removeEventListener("pointerdown", onPointerDown);
      spread.removeEventListener("pointermove", onPointerMove);
      spread.removeEventListener("pointerup", endDrag);
      spread.removeEventListener("pointercancel", endDrag);
      spread.removeEventListener("touchstart", onTouchStart);
      spread.removeEventListener("touchmove", onTouchMove);
      spread.removeEventListener("touchend", onTouchEnd);
      spread.removeEventListener("mousemove", onMouseMove);
      spread.removeEventListener("mouseleave", onMouseLeave);
      spread.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [
    enabled,
    readerRef,
    spreadRef,
    panningClass,
    hotspotClass,
    zoomToward,
    clampPan,
    applyTransform,
    resetZoom,
  ]);

  return { isZoomed, zoomIn, zoomOut, resetZoom };
}
