"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
/** Below this we treat the view as "not zoomed" and snap back to a clean fit. */
const ZOOM_EPSILON = 1.001;
const TAP_SLOP = 12;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 30;

/** The tail of a swipe we measure the release speed over. Long enough to be
    steady, short enough that a finger which stopped dead reads as stopped. */
const VELOCITY_WINDOW_MS = 100;

/** While zoomed, horizontal drag the pan could not absorb — the page is already
    hard against its edge — that adds up to a page turn. Generous, so ordinary
    panning against the edge never turns by accident. */
const EDGE_TURN_PX = 72;

/** Click-to-turn lives in the outer gutters only, so a click on the article
    itself does not flip the page. */
const EDGE_ZONE_FRACTION = 0.12;
const EDGE_ZONE_MIN = 56;
const EDGE_ZONE_MAX = 140;

type Options = {
  readerRef: RefObject<HTMLDivElement | null>;
  spreadRef: RefObject<HTMLDivElement | null>;
  /** Hashed CSS-module class names, toggled imperatively (see Invariant 2). */
  zoomedClass: string;
  panningClass: string;
  hotspotClass: string;
  /** ms is the settle duration; omitted, the caller's default turn is used. */
  onNavigate: (delta: number, ms?: number) => void;
  /** A touch swipe is taking hold of the track. Reader lands any turn still in
      flight and records where the track is, so the drag continues from there. */
  onDragStart: () => void;
  /** Live horizontal drag of a touch swipe (scale 1). dx is px from the start;
      Reader translates the track and rubber-bands at the ends. */
  onDragMove: (dx: number) => void;
  /** End of a touch swipe: Reader commits (dragged past ~18% of the width, or
      flicked) or snaps the track back. velocity is px/ms, negative leftwards. */
  onDragEnd: (dx: number, width: number, velocity: number) => void;
  isMobile: boolean;
  enabled: boolean;
};

/**
 * Zoom, pan, pinch, swipe and click-to-turn. Imperative on purpose:
 *
 *  1. Pan/pinch write the transform on every pointer event; React state would
 *     re-render per frame and drop below 60fps.
 *  2. React registers touchmove/wheel as PASSIVE, so JSX handlers cannot
 *     preventDefault() — pinch and pan would scroll the page. They must be
 *     native listeners with { passive: false }.
 */
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

  // Latest-value refs: listeners attach once and must not go stale.
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

    // Synchronous, not React state: this drives touch-action, and a frame of lag
    // would let a pan gesture scroll the page.
    const zoomed = scale > ZOOM_EPSILON;
    reader.classList.toggle(zoomedClass, zoomed);
    if (zoomed !== zoomedRef.current) {
      zoomedRef.current = zoomed;
      setIsZoomed(zoomed);
    }
  }, [readerRef, spreadRef, zoomedClass]);

  const resetZoom = useCallback(() => {
    // Mutate in place. Reassigning would detach every native listener from the
    // live transform and break the gestures in ways that look random.
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

  /** Zoom while keeping the point under the cursor/finger stationary. */
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

  /** + button: one step in, capped at MAX_SCALE. */
  const zoomIn = useCallback(() => {
    const spread = spreadRef.current;
    if (!spread) return;
    const rect = spread.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    zoomToward(transform.current.scale + 1, cx, cy);
  }, [spreadRef, zoomToward]);

  /** - button: one step out, snapping to a clean fit at MIN_SCALE. */
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

    // Safe to alias only because the object is mutated, never reassigned.
    const t = transform.current;

    const dist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const mid = (a: Touch, b: Touch) => ({
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    });

    // ---- Wheel / trackpad ----
    let wheelTimer: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      // At fit size, let the page scroll. Trackpad pinch arrives as ctrl+wheel.
      if (t.scale <= 1 && !e.ctrlKey) return;
      e.preventDefault();
      reader.classList.add(panningClass);
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomToward(t.scale * factor, e.clientX, e.clientY);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => reader.classList.remove(panningClass), 120);
    };

    // ---- Mouse drag to pan (only while zoomed) ----
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
      } catch {
        // capture is a nicety; panning works without it
      }
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

    // ---- Touch: swipe turns pages, pinch/pan/double-tap drive zoom ----
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
    // Axis of the current one-finger swipe: 'h' follows the finger to turn the
    // page, 'v' is left alone so the document still scrolls. Null until the
    // gesture clears the slop and commits to an axis.
    let swipeAxis: "h" | "v" | null = null;
    // Tail of the swipe, for the release speed.
    let samples: { x: number; t: number }[] = [];
    // Horizontal drag a zoomed pan could not absorb, and whether it has already
    // spent itself on a turn.
    let edgeSpill = 0;
    let edgeTurned = false;

    /** Speed at the moment of release, px/ms, negative leftwards. */
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

        // Horizontal movement the pan could not take — the page is already hard
        // against its edge. Rather than dead-ending there, let it accumulate
        // into a page turn: a reader who is zoomed in should not have to zoom
        // out to move on. A change of direction spends the accumulation.
        const spill = stepX - (t.tx - txBefore);
        if (spill * edgeSpill < 0) edgeSpill = 0;
        edgeSpill += spill;

        if (!edgeTurned && Math.abs(edgeSpill) > EDGE_TURN_PX) {
          edgeTurned = true;
          mode = null; // the gesture has become a turn; it is no longer a pan
          reader.classList.remove(panningClass);
          navigateRef.current(edgeSpill < 0 ? 1 : -1); // Reader resets the zoom
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

        // Only a horizontal swipe drives a page turn; a vertical one is left
        // alone (no preventDefault) so the document keeps scrolling.
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
          // The finger has been dragging the track live, with the next page
          // already on stage behind it. Let Reader carry it the rest of the way
          // or snap it back.
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
        mode = "pan"; // lifting one finger out of a pinch leaves the other panning

        startX = touchLastX = e.touches[0].clientX;
        startY = touchLastY = e.touches[0].clientY;
      }
    };

    // ---- Desktop click-to-turn, confined to the outer gutters ----

    /** -1 back, 1 forward, 0 for the page itself. */
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

    // A zone you cannot see is a zone nobody finds, so hovering one arms the
    // cursor. data-edge, not a class: React owns className on this node.
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
      if (t.scale > 1) return; // while zoomed, a click is the end of a pan
      if ((e.target as Element).closest(`.${hotspotClass}`)) return;
      const dir = edgeAt(e.clientX);
      if (dir !== 0) navigateRef.current(dir);
    };

    // ---- Keys ----

    // The arrows belong to the reader only while the reader is what you are
    // looking at. Scrolled away, they are the page's again.
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

      // Typing, or driving a control that has its own meaning for the arrows.
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

    // Teardown must be symmetric: StrictMode mounts effects twice in dev, and a
    // missed listener makes one swipe turn two pages.
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
