"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildPageNumbering } from "@/lib/pageLayout";
import type { ReaderHotspot, ReaderPage } from "@/lib/types";
import { PageList } from "./PageList";
import { ReaderControls } from "./ReaderControls";
import { useBackgroundDecode } from "./useBackgroundDecode";
import { useIsMobile } from "./useIsMobile";
import { useZoom } from "./useZoom";
import { buildViews, findViewIndex, pageRangeLabel } from "./views";
import styles from "./Reader.module.css";

type ReaderProps = {
  pages: ReaderPage[];
  hotspots?: ReaderHotspot[];
};

/**
 * React and useZoom must never write the same DOM property on the same node:
 *
 *   .reader   React owns a STATIC className and the --stage-ar custom property;
 *             useZoom owns .isZoomed/.isPanning. A dynamic className here would
 *             make React wipe .isZoomed. The `style` prop is safe: useZoom only
 *             touches this node's classList.
 *   .spread   React owns className; useZoom owns style.transform. Never pass a
 *             `style` prop to it — --stage-ar reaches it by inheritance instead.
 *   .page     React owns className and --page-ar; nothing imperative touches it.
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

export function Reader({ pages, hotspots = [] }: ReaderProps) {
  const readerRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

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

  // Read by native listeners in useZoom, so it must be stable and never stale:
  // state comes from refs, not closures.
  const currentRef = useRef(0);
  const viewCountRef = useRef(views.length);
  const resetZoomRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    viewCountRef.current = views.length;
  }, [views.length]);

  const navigate = useCallback((delta: number) => {
    const next = currentRef.current + delta;
    if (next < 0 || next >= viewCountRef.current) return;
    // Before the state change, so the new spread never paints mid-zoom.
    resetZoomRef.current?.();
    setCurrent(next);
  }, []);

  const { isZoomed, zoomIn, zoomOut, resetZoom } = useZoom({
    readerRef,
    spreadRef,
    zoomedClass: styles.isZoomed,
    panningClass: styles.isPanning,
    hotspotClass: styles.hotspot,
    onNavigate: navigate,
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
    setCurrent((prev) => {
      const previousViews = buildViews(spreads, !isMobile);
      const anchorPage = previousViews[prev]?.pages[0] ?? 0;
      return findViewIndex(buildViews(spreads, isMobile), anchorPage);
    });
  }, [isMobile, spreads, resetZoom]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  const view = views[current];
  if (!view) return null;

  // A lone SPREAD image is not "single": it is a whole opening and must fill the
  // stage, not be narrowed to a cover's width.
  const isSingle = view.pages.length === 1 && !pages[view.pages[0]]?.isSpread;

  return (
    <div
      className={styles.reader}
      id="reader"
      ref={readerRef}
      style={{ "--stage-ar": stageAr.toFixed(4) } as React.CSSProperties}
    >
      {/* The spread stays in flow while loading. Its pages carry an
          aspect-ratio and a white background, so the box is the right size
          from the first paint and the cover drops into it without moving
          anything. Hiding it until `ready` cost ~0.6 CLS. */}
      <div
        ref={spreadRef}
        className={[styles.spread, isSingle ? styles.single : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <PageList
          pages={pages}
          hotspots={hotspots}
          visible={view.pages}
          registerImg={registerImg}
        />
        {!ready && <div className={styles.loading}>ielādē numuru</div>}
      </div>

      <ReaderControls
        label={pageRangeLabel(view, numbering)}
        totalPages={numbering.total}
        canPrev={current > 0}
        canNext={current < views.length - 1}
        isZoomed={isZoomed}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFullscreen={toggleFullscreen}
      />
    </div>
  );
}
