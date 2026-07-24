"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildPageNumbering } from "@/domain/page";
import type { ReaderHotspot, ReaderPage } from "@/domain/types";
import { PageList } from "./PageList";
import { ReaderControls } from "./ReaderControls";
import { usePagePreload } from "./usePagePreload";
import { useIsMobile } from "./useIsMobile";
import { useZoom } from "./useZoom";
import { buildViews, findViewIndex, pageRangeLabel } from "@/domain/views";
import styles from "./Reader.module.css";

type ReaderProps = {
  pages: ReaderPage[];
  hotspots?: ReaderHotspot[];
};

const TURN_MS = 260;
const MIN_TURN_MS = 130;
const TURN_EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const SNAP_FRACTION = 0.18;
const FLICK_VELOCITY = 0.45;
const RUBBER_BAND = 0.35;

// Ownership: useZoom owns the root's isZoomed/isPanning classes and the spread's
// transform + data-edge; Reader owns the slider. Their classNames must stay STATIC.

function stageRatio(pages: ReaderPage[]): number {
  const units = pages
    .filter((page) => page.width > 0 && page.height > 0)
    .map((page) => {
      const ratio = page.width / page.height;
      return page.isSpread ? ratio / 2 : ratio;
    })
    .sort((a, b) => a - b);

  if (units.length === 0) return 2 / 1.414;

  const unit = units[Math.floor(units.length / 2)];
  return Math.min(Math.max(2 * unit, 1), 2.4);
}

function trackX(el: HTMLElement): number {
  const value = getComputedStyle(el).transform;
  if (!value || value === "none") return 0;
  try {
    return new DOMMatrixReadOnly(value).m41;
  } catch {
    return 0;
  }
}

export function Reader({ pages, hotspots = [] }: ReaderProps) {
  const readerRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  const reducedMotion = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotion.current = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);

  const spreads = useMemo(() => pages.map((page) => page.isSpread), [pages]);

  const views = useMemo(() => buildViews(spreads, isMobile), [spreads, isMobile]);

  const numbering = useMemo(() => buildPageNumbering(spreads), [spreads]);

  const stageAr = useMemo(() => stageRatio(pages), [pages]);

  const registerImg = useCallback((index: number, el: HTMLImageElement | null) => {
    imgRefs.current[index] = el;
  }, []);

  // Readiness must never wedge: it gates the loading overlay, zoom and preload,
  // so any single path that can hang leaves the whole reader dead. iOS Safari's
  // img.decode() can return a promise that neither resolves nor rejects when the
  // image isn't paintable at call time, so we never rely on it alone — decode,
  // load and complete all race, plus a hard timeout backstop, plus a short poll
  // in case the first <img> ref isn't attached yet on the first pass.
  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setTimeout> | undefined;

    const done = () => {
      if (!cancelled) setReady(true);
    };

    const arm = (first: HTMLImageElement) => {
      if (first.complete) {
        done();
        return;
      }
      first.addEventListener("load", done, { once: true });
      first.addEventListener("error", done, { once: true });
      // decode() is a best-effort accelerator; if it settles first, great, but
      // load/error/timeout are what actually guarantee we get here.
      first.decode?.().then(done, done);
    };

    const tryArm = () => {
      if (cancelled) return;
      const first = imgRefs.current[0];
      if (first) arm(first);
      else poll = setTimeout(tryArm, 50);
    };
    tryArm();

    // Hard backstop: never let the overlay outlive a stalled/hung signal.
    const timeout = setTimeout(done, 2000);

    return () => {
      cancelled = true;
      if (poll) clearTimeout(poll);
      clearTimeout(timeout);
    };
  }, [pages]);

  usePagePreload(imgRefs, views, current, ready);

  const currentRef = useRef(0);
  const viewCountRef = useRef(views.length);
  const resetZoomRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    viewCountRef.current = views.length;
  }, [views.length]);

  const turn = useRef<{ next: number; delta: number } | null>(null);
  const turnToken = useRef(0);
  const dragBase = useRef(0);

  const slide = useCallback(
    (value: string, animate: boolean, ms: number = TURN_MS) => {
      const el = sliderRef.current;
      if (!el) return;
      el.style.transition =
        animate && !reducedMotion.current
          ? `transform ${ms}ms ${TURN_EASE}`
          : "none";
      el.style.transform = value;
    },
    [],
  );

  /** Lands an in-flight turn without moving a pixel. */
  const finishTurn = useCallback(() => {
    const pending = turn.current;
    const el = sliderRef.current;
    if (!pending || !el) return;

    const x = trackX(el);
    turn.current = null;
    turnToken.current += 1;

    flushSync(() => setCurrent(pending.next));
    currentRef.current = pending.next;

    slide(`translateX(${x + pending.delta * el.offsetWidth}px)`, false);
  }, [slide]);

  const navigate = useCallback(
    (delta: number, ms: number = TURN_MS) => {
      finishTurn();

      const el = sliderRef.current;
      const next = currentRef.current + delta;

      if (next < 0 || next >= viewCountRef.current) {
        slide("", true);
        return;
      }

      resetZoomRef.current?.();

      if (!el || reducedMotion.current) {
        flushSync(() => setCurrent(next));
        currentRef.current = next;
        slide("", false);
        return;
      }

      const token = ++turnToken.current;
      turn.current = { next, delta };
      slide(`translateX(${-delta * 100}%)`, true, ms);

      let timer: ReturnType<typeof setTimeout>;
      let done = false;

      const settle = (e?: TransitionEvent) => {
        if (e && (e.target !== el || e.propertyName !== "transform")) return;
        if (done) return;
        done = true;
        el.removeEventListener("transitionend", settle);
        clearTimeout(timer);
        if (token !== turnToken.current) return;

        turn.current = null;
        flushSync(() => setCurrent(next));
        currentRef.current = next;
        slide("", false);
      };

      // Backstop for a lost transitionend; must never preempt a late-running turn.
      const backstop = () => {
        if (el.getAnimations().some((a) => a.playState === "running")) {
          timer = setTimeout(backstop, 80);
          return;
        }
        settle();
      };

      timer = setTimeout(backstop, ms + 60);
      el.addEventListener("transitionend", settle);
    },
    [finishTurn, slide],
  );

  const onDragStart = useCallback(() => {
    finishTurn();
    const el = sliderRef.current;
    dragBase.current = el ? trackX(el) : 0;
  }, [finishTurn]);

  const onDragMove = useCallback((dx: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const raw = dragBase.current + dx;
    const atStart = currentRef.current === 0;
    const atEnd = currentRef.current >= viewCountRef.current - 1;
    const x =
      (atStart && raw > 0) || (atEnd && raw < 0) ? raw * RUBBER_BAND : raw;
    el.style.transition = "none";
    el.style.transform = `translateX(${x}px)`;
  }, []);

  const onDragEnd = useCallback(
    (dx: number, width: number, velocity: number) => {
      const raw = dragBase.current + dx;
      dragBase.current = 0;

      const dir = raw < 0 ? 1 : -1;
      const atStart = currentRef.current === 0;
      const atEnd = currentRef.current >= viewCountRef.current - 1;
      const canGo = dir > 0 ? !atEnd : !atStart;

      const far = Math.abs(raw) > width * SNAP_FRACTION;
      const flick = Math.abs(velocity) > FLICK_VELOCITY && velocity * dir < 0;

      if (!canGo || (!far && !flick)) {
        slide("", true);
        return;
      }

      const remaining = Math.abs(dir * width + raw);
      const speed = Math.max(Math.abs(velocity), remaining / TURN_MS);
      const ms = Math.max(MIN_TURN_MS, Math.min(TURN_MS, remaining / speed));
      navigate(dir, ms);
    },
    [navigate, slide],
  );

  const { isZoomed, zoomIn, zoomOut, resetZoom } = useZoom({
    readerRef,
    spreadRef,
    zoomedClass: styles.isZoomed,
    panningClass: styles.isPanning,
    hotspotClass: styles.hotspot,
    onNavigate: navigate,
    onDragStart,
    onDragMove,
    onDragEnd,
    isMobile,
    enabled: ready,
  });

  useEffect(() => {
    resetZoomRef.current = resetZoom;
  }, [resetZoom]);

  // Crossing the breakpoint rebuilds the views; stay on the page being read.
  const prevIsMobile = useRef(isMobile);
  useEffect(() => {
    if (prevIsMobile.current === isMobile) return;
    prevIsMobile.current = isMobile;

    resetZoom();
    turn.current = null;
    turnToken.current += 1;
    slide("", false);

    setCurrent((prev) => {
      const previousViews = buildViews(spreads, !isMobile);
      const anchorPage = previousViews[prev]?.pages[0] ?? 0;
      const next = findViewIndex(buildViews(spreads, isMobile), anchorPage);
      currentRef.current = next;
      return next;
    });
  }, [isMobile, spreads, resetZoom, slide]);

  // On unmount, supersede any pending settle so it cannot flushSync a dead component.
  useEffect(() => {
    return () => {
      turnToken.current += 1;
    };
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const view = views[current];
  if (!view) return <EmptyState>šim numuram vēl nav lapu.</EmptyState>;

  return (
    <div
      className="mx-auto max-w-[1200px] scroll-mt-8 touch-pan-y"
      ref={readerRef}
      style={{ "--stage-ar": stageAr.toFixed(4) } as React.CSSProperties}
    >
      <div ref={spreadRef} className={styles.spread}>
        <div
          ref={sliderRef}
          className="relative flex h-full w-full items-center justify-center"
        >
          <PageList
            pages={pages}
            hotspots={hotspots}
            views={views}
            current={current}
            registerImg={registerImg}
          />
        </div>
        {!ready && (
          <div
            className={`${styles.loading} absolute inset-0 z-[6] flex items-center justify-center text-center font-serif text-[1.05rem] italic text-ink-soft`}
          >
            ielādē numuru
          </div>
        )}
      </div>

      <ReaderControls
        label={pageRangeLabel(view, numbering)}
        totalPages={numbering.total}
        canPrev={current > 0}
        canNext={current < views.length - 1}
        isZoomed={isZoomed}
        isFullscreen={isFullscreen}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFullscreen={toggleFullscreen}
      />
    </div>
  );
}
