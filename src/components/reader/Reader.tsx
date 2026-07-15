"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildPageNumbering } from "@/domain/page";
import type { ReaderHotspot, ReaderPage } from "@/domain/types";
import { PageList } from "./PageList";
import { ReaderControls } from "./ReaderControls";
import { useBackgroundDecode } from "./useBackgroundDecode";
import { useIsMobile } from "./useIsMobile";
import { useZoom } from "./useZoom";
import { buildViews, findViewIndex, pageRangeLabel } from "@/domain/views";
import styles from "./Reader.module.css";

type ReaderProps = {
  pages: ReaderPage[];
  hotspots?: ReaderHotspot[];
};

/** One shared ease for every page turn — buttons, keys, edge-clicks, swipe. A
    turn is ONE motion of one stage width, never an out-then-in pair. */
const TURN_MS = 260;
/** Floor for a flick: a fast finger lands the page quickly, but never so quickly
    that the turn stops reading as a movement. */
const MIN_TURN_MS = 130;
const TURN_EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
/** Past this fraction of the stage width, a release commits the turn. */
const SNAP_FRACTION = 0.18;
/** …or past this speed (px/ms), however short the drag. */
const FLICK_VELOCITY = 0.45;
/** Resistance applied to a drag past the first/last view. */
const RUBBER_BAND = 0.35;

/**
 * React and useZoom must never write the same DOM property on the same node:
 *
 *   .reader   React owns a STATIC className and the --stage-ar custom property;
 *             useZoom owns .isZoomed/.isPanning. A dynamic className here would
 *             make React wipe .isZoomed. The `style` prop is safe: useZoom only
 *             touches this node's classList.
 *   .spread   React owns className; useZoom owns style.transform and the
 *             data-edge attribute (the click-to-turn cursor). Never pass a
 *             `style` prop to it — --stage-ar reaches it by inheritance instead.
 *   .slider   React owns className; Reader owns style.transform (the turn).
 *   .slot     React owns className and --slot-x; nothing imperative touches it.
 */

/**
 * The ratio of the stage, which is two printed pages wide. Taken from the issue's
 * own scans rather than a hardcoded A4, so a normal opening fills the stage
 * exactly instead of floating inside it. Median, so one odd scan cannot skew the
 * whole issue; clamped, so a garbage dimension cannot produce an absurd box. It
 * comes from data present at SSR, so the stage is right on the first paint.
 */
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

/** Where the track actually is right now, mid-transition included. */
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

  // Honour reduced-motion for the slide (kept in a ref so the stable native
  // gesture handlers never read a stale value).
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

  // Printed page numbers, for the label and the total ONLY. Hotspots stay keyed
  // to image indices — see lib/pageLayout.ts.
  const numbering = useMemo(() => buildPageNumbering(spreads), [spreads]);

  const stageAr = useMemo(() => stageRatio(pages), [pages]);

  const registerImg = useCallback((index: number, el: HTMLImageElement | null) => {
    imgRefs.current[index] = el;
  }, []);

  // Reveal only once the first page can paint in one go. Images stay mounted
  // while hidden, so the decode is already in flight.
  useEffect(() => {
    let cancelled = false;
    const first = imgRefs.current[0];
    if (!first) return;

    const done = () => {
      if (!cancelled) setReady(true);
    };
    if (first.decode) first.decode().then(done, done);
    else if (first.complete) done();
    else first.addEventListener("load", done, { once: true });

    return () => {
      cancelled = true;
    };
  }, [pages]);

  useBackgroundDecode(imgRefs, ready);

  // Read by native listeners in useZoom, so these must be stable and never
  // stale: state comes from refs, not closures.
  const currentRef = useRef(0);
  const viewCountRef = useRef(views.length);
  const resetZoomRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    viewCountRef.current = views.length;
  }, [views.length]);

  // The turn in flight, if any. A token lets a newer turn supersede the pending
  // transitionend/timeout of an older one.
  const turn = useRef<{ next: number; delta: number } | null>(null);
  const turnToken = useRef(0);
  // Where the track sat when the current drag began — non-zero only when the
  // finger grabbed the stage mid-turn.
  const dragBase = useRef(0);

  /** Set the track's transform, optionally with the shared turn ease. */
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

  /**
   * Land an in-flight turn immediately, without moving a pixel.
   *
   * Slots are laid out relative to `current`, so committing a turn of `delta`
   * shifts every one of them `delta` stage widths to the left. Add that back to
   * the track and the frame on screen is bit-for-bit the same — the turn is now
   * simply expressed relative to the view it was heading for. That is what lets
   * a second turn (rapid arrow clicks, or a finger grabbing the stage mid-slide)
   * start from exactly where the eye last saw the pages, instead of restarting
   * or jumping.
   */
  const finishTurn = useCallback(() => {
    const pending = turn.current;
    const el = sliderRef.current;
    if (!pending || !el) return;

    const x = trackX(el);
    turn.current = null;
    turnToken.current += 1; // the pending transitionend/timeout now no-ops

    flushSync(() => setCurrent(pending.next));
    currentRef.current = pending.next;

    slide(`translateX(${x + pending.delta * el.offsetWidth}px)`, false);
  }, [slide]);

  const navigate = useCallback(
    (delta: number, ms: number = TURN_MS) => {
      finishTurn();

      const el = sliderRef.current;
      const next = currentRef.current + delta;

      // Nothing there: settle the track (a rubber-banded drag has offset it).
      if (next < 0 || next >= viewCountRef.current) {
        slide("", true);
        return;
      }

      // Before the state change, so the incoming view never paints mid-zoom.
      resetZoomRef.current?.();

      if (!el || reducedMotion.current) {
        flushSync(() => setCurrent(next));
        currentRef.current = next;
        slide("", false);
        return;
      }

      // ONE motion. The neighbouring view is already mounted and on stage, one
      // width away, so this slides it in — it is not swapped in afterwards.
      const token = ++turnToken.current;
      turn.current = { next, delta };
      slide(`translateX(${-delta * 100}%)`, true, ms);

      let timer: ReturnType<typeof setTimeout>;
      let done = false;

      const settle = (e?: TransitionEvent) => {
        // Ignore transitions bubbling up from children (e.g. a hotspot's
        // background) — only the track's own transform ends a turn.
        if (e && (e.target !== el || e.propertyName !== "transform")) return;
        if (done) return;
        done = true;
        el.removeEventListener("transitionend", settle);
        clearTimeout(timer);
        if (token !== turnToken.current) return; // superseded

        turn.current = null;
        // Re-index. The track at -delta widths with the OLD current paints the
        // same pixels as the track at 0 with the NEW one, so committing the
        // state and dropping the transform inside one task shows no seam and
        // needs no forced reflow.
        flushSync(() => setCurrent(next));
        currentRef.current = next;
        slide("", false);
      };

      // transitionend is the real signal. This only backs it up for the case
      // where it never arrives at all — and it must never PREEMPT a turn that is
      // merely running late. The main thread can stall for a couple of hundred
      // ms just as a turn starts (rasterising the page that has come on stage),
      // which delays the transition without shortening it; a plain wall-clock
      // deadline fires mid-slide and chops the last of the travel off, which is
      // precisely the snap this rework exists to remove. So: ask whether the
      // track is still moving, and only settle once it truly is not.
      const backstop = () => {
        if (el.getAnimations().some((a) => a.playState === "running")) {
          timer = setTimeout(backstop, 80); // still travelling — let it land
          return;
        }
        settle();
      };

      timer = setTimeout(backstop, ms + 60);
      el.addEventListener("transitionend", settle);
    },
    [finishTurn, slide],
  );

  // ---- Touch drag (useZoom reports the deltas) ----

  const onDragStart = useCallback(() => {
    finishTurn(); // grabbing the stage mid-turn takes over from where it is
    const el = sliderRef.current;
    dragBase.current = el ? trackX(el) : 0;
  }, [finishTurn]);

  const onDragMove = useCallback((dx: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const raw = dragBase.current + dx;
    const atStart = currentRef.current === 0;
    const atEnd = currentRef.current >= viewCountRef.current - 1;
    // Past the first/last view there is no page to pull in, so the track goes
    // stiff rather than dragging empty stage across.
    const x =
      (atStart && raw > 0) || (atEnd && raw < 0) ? raw * RUBBER_BAND : raw;
    el.style.transition = "none";
    el.style.transform = `translateX(${x}px)`;
  }, []);

  const onDragEnd = useCallback(
    (dx: number, width: number, velocity: number) => {
      const raw = dragBase.current + dx;
      dragBase.current = 0;

      const dir = raw < 0 ? 1 : -1; // dragging left turns to the next view
      const atStart = currentRef.current === 0;
      const atEnd = currentRef.current >= viewCountRef.current - 1;
      const canGo = dir > 0 ? !atEnd : !atStart;

      // Two ways to commit: drag far enough, or flick fast enough. The flick
      // only counts while it is still travelling the way the page was dragged —
      // a finger that reverses at the last moment is asking to snap back.
      const far = Math.abs(raw) > width * SNAP_FRACTION;
      const flick = Math.abs(velocity) > FLICK_VELOCITY && velocity * dir < 0;

      if (!canGo || (!far && !flick)) {
        slide("", true);
        return;
      }

      // Finish at the speed the finger was already going, so the turn reads as
      // one continuous motion rather than a drag and then a separate animation.
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

  // Crossing the breakpoint rebuilds the views: keep the reader on the page it
  // was showing rather than snapping back to the cover.
  const prevIsMobile = useRef(isMobile);
  useEffect(() => {
    if (prevIsMobile.current === isMobile) return;
    prevIsMobile.current = isMobile;

    resetZoom();
    // Any turn in flight was measured against the old view list.
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

  // Supersede any turn still in flight when the reader unmounts (e.g. a hotspot
  // click mid-turn), so its pending settle cannot flushSync a dead component.
  useEffect(() => {
    return () => {
      turnToken.current += 1;
    };
  }, []);

  // Kept in sync with the actual state, so ESC (or the OS leaving fullscreen)
  // keeps the button's label and pressed state honest.
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
      className={styles.reader}
      ref={readerRef}
      style={{ "--stage-ar": stageAr.toFixed(4) } as React.CSSProperties}
    >
      {/* The spread stays in flow while loading. Its pages carry an
          aspect-ratio and a white background, so the box is the right size
          from the first paint and the cover drops into it without moving
          anything. Hiding it until `ready` cost ~0.6 CLS. */}
      <div ref={spreadRef} className={styles.spread}>
        <div ref={sliderRef} className={styles.slider}>
          <PageList
            pages={pages}
            hotspots={hotspots}
            views={views}
            current={current}
            registerImg={registerImg}
          />
        </div>
        {!ready && <div className={styles.loading}>ielādē numuru</div>}
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
