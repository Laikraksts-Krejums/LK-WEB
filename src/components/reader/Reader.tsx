"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
 *   .reader   React owns a STATIC className; useZoom owns .isZoomed/.isPanning.
 *             A dynamic className here would make React wipe .isZoomed.
 *   .spread   React owns className; useZoom owns style.transform. Never pass a
 *             `style` prop to it.
 *   .page     React owns className; nothing imperative touches it.
 */
export function Reader({ pages, hotspots = [] }: ReaderProps) {
  const readerRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);

  const views = useMemo(
    () => buildViews(pages.length, isMobile),
    [pages.length, isMobile],
  );

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

  const { isZoomed, cycleZoom, resetZoom } = useZoom({
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
      const previousViews = buildViews(pages.length, !isMobile);
      const anchorPage = previousViews[prev]?.pages[0] ?? 0;
      return findViewIndex(buildViews(pages.length, isMobile), anchorPage);
    });
  }, [isMobile, pages.length, resetZoom]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  const view = views[current];
  if (!view) return null;

  const isSingle = view.pages.length === 1;

  return (
    <div className={styles.reader} id="reader" ref={readerRef}>
      {!ready && <div className={styles.loading}>ielādē numuru</div>}

      <div
        ref={spreadRef}
        className={[
          styles.spread,
          isSingle ? styles.single : "",
          ready ? "" : styles.hidden,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <PageList
          pages={pages}
          hotspots={hotspots}
          visible={view.pages}
          registerImg={registerImg}
        />
      </div>

      <ReaderControls
        label={pageRangeLabel(view)}
        totalPages={pages.length}
        canPrev={current > 0}
        canNext={current < views.length - 1}
        isZoomed={isZoomed}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onZoom={cycleZoom}
        onFullscreen={toggleFullscreen}
      />
    </div>
  );
}
