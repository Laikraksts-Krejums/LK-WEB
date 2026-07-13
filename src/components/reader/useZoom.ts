"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
/** Below this we treat the view as "not zoomed" and snap back to a clean fit. */
const ZOOM_EPSILON = 1.001;
const SWIPE_THRESHOLD = 50;
const TAP_SLOP = 12;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 30;

type Options = {
  readerRef: RefObject<HTMLDivElement | null>;
  spreadRef: RefObject<HTMLDivElement | null>;
  /** Hashed CSS-module class names, toggled imperatively (see Invariant 2). */
  zoomedClass: string;
  panningClass: string;
  hotspotClass: string;
  onNavigate: (delta: number) => void;
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
  isMobile,
  enabled,
}: Options) {
  const transform = useRef({ scale: 1, tx: 0, ty: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const zoomedRef = useRef(false);

  // Latest-value refs: listeners attach once and must not go stale.
  const navigateRef = useRef(onNavigate);
  const isMobileRef = useRef(isMobile);
  useEffect(() => {
    navigateRef.current = onNavigate;
  }, [onNavigate]);
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

  /** Zoom button: 1x → 2x → 3x → back to fit. */
  const cycleZoom = useCallback(() => {
    const spread = spreadRef.current;
    if (!spread) return;
    const rect = spread.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (transform.current.scale >= 3) resetZoom();
    else zoomToward(transform.current.scale + 1, cx, cy);
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

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        mode = "pinch";
        pinchStartDist = dist(e.touches[0], e.touches[1]) || 1;
        pinchStartScale = t.scale;
        reader.classList.add(panningClass);
      } else if (e.touches.length === 1) {
        startX = touchLastX = e.touches[0].clientX;
        startY = touchLastY = e.touches[0].clientY;
        mode = t.scale > 1 ? "pan" : "swipe";
        if (mode === "pan") reader.classList.add(panningClass);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (mode === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        const d = dist(e.touches[0], e.touches[1]);
        const m = mid(e.touches[0], e.touches[1]);
        zoomToward(pinchStartScale * (d / pinchStartDist), m.x, m.y);
      } else if (mode === "pan" && e.touches.length === 1) {
        e.preventDefault();
        t.tx += e.touches[0].clientX - touchLastX;
        t.ty += e.touches[0].clientY - touchLastY;
        touchLastX = e.touches[0].clientX;
        touchLastY = e.touches[0].clientY;
        clampPan();
        applyTransform();
      }
      // Swipe mode never preventDefaults, so the page can still scroll.
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
        const dx = endX - startX;
        const dy = endY - startY;
        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          navigateRef.current(dx < 0 ? 1 : -1);
        } else if (moved < TAP_SLOP && isDoubleTap()) {
          zoomToward(DOUBLE_TAP_SCALE, endX, endY);
        }
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

    const onClick = (e: MouseEvent) => {
      if (isMobileRef.current) return;
      if (t.scale > 1) return; // while zoomed, a click is the end of a pan
      if ((e.target as Element).closest(`.${hotspotClass}`)) return;
      const rect = spread.getBoundingClientRect();
      navigateRef.current(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigateRef.current(-1);
      if (e.key === "ArrowRight") navigateRef.current(1);
    };

    spread.addEventListener("wheel", onWheel, { passive: false });
    spread.addEventListener("pointerdown", onPointerDown);
    spread.addEventListener("pointermove", onPointerMove);
    spread.addEventListener("pointerup", endDrag);
    spread.addEventListener("pointercancel", endDrag);
    spread.addEventListener("touchstart", onTouchStart, { passive: true });
    spread.addEventListener("touchmove", onTouchMove, { passive: false });
    spread.addEventListener("touchend", onTouchEnd, { passive: true });
    spread.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);

    // Teardown must be symmetric: StrictMode mounts effects twice in dev, and a
    // missed listener makes one swipe turn two pages.
    return () => {
      clearTimeout(wheelTimer);
      spread.removeEventListener("wheel", onWheel);
      spread.removeEventListener("pointerdown", onPointerDown);
      spread.removeEventListener("pointermove", onPointerMove);
      spread.removeEventListener("pointerup", endDrag);
      spread.removeEventListener("pointercancel", endDrag);
      spread.removeEventListener("touchstart", onTouchStart);
      spread.removeEventListener("touchmove", onTouchMove);
      spread.removeEventListener("touchend", onTouchEnd);
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

  return { isZoomed, cycleZoom, resetZoom };
}
