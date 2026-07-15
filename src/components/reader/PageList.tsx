import type { ReaderHotspot, ReaderPage } from "@/lib/types";
import { Hotspot } from "./Hotspot";
import type { View } from "./views";
import styles from "./Reader.module.css";

type PageListProps = {
  pages: ReaderPage[];
  hotspots: ReaderHotspot[];
  views: View[];
  current: number;
  registerImg: (index: number, el: HTMLImageElement | null) => void;
};

/** Views either side of the current one that are actually on stage. One is all a
    turn can ever reveal, and rendering more costs raster memory for pages the
    reader will never see mid-gesture. */
const NEAR = 1;

/**
 * The carousel track: one slot per view, laid out at (v - current) stage widths.
 * The current slot sits at 0, its neighbours wait one width off either side, and
 * Reader turns a page by translating the whole track. That is what makes a swipe
 * pull the next page in under the finger — it is already there, on stage, one
 * width away.
 *
 * Every page stays mounted. Do NOT render only the nearby views: flipping is
 * instant because all N bitmaps are decoded and resident, and unmounting an
 * <img> lets the browser evict the bitmap and turns every page turn back into a
 * decode. Far slots are display:none — rendered nowhere, mounted still.
 * Regression test: flipping through the issue must produce zero new image
 * requests.
 *
 * The three boxes are not the same thing, and the difference is what makes
 * mobile's half-spread views possible:
 *
 *   .slot   one VIEW. Exactly one stage wide, whatever it holds.
 *   .page   the WINDOW. Usually the whole sheet; on mobile, half of a spread.
 *   .sheet  the IMAGE's box, always, exactly. Hotspots are percentages of the
 *           whole scan, so they live in here — never in .page. Showing half a
 *           spread then costs nothing but sliding .sheet under .page, and the
 *           coordinates stay true with no remapping.
 */
export function PageList({
  pages,
  hotspots,
  views,
  current,
  registerImg,
}: PageListProps) {
  return (
    <>
      {views.map((view, v) => {
        const offset = v - current;

        // A lone SPREAD image is not "single": it is a whole opening and must
        // fill the stage, not be narrowed to a cover's width. HALF a spread,
        // though, is one printed page and sizes like any other (mobile only).
        const isSingle =
          view.pages.length === 1 &&
          (!pages[view.pages[0]]?.isSpread || Boolean(view.half));

        const slotClasses = [styles.slot];
        if (Math.abs(offset) <= NEAR) slotClasses.push(styles.isNear);
        if (offset === 0) slotClasses.push(styles.isCurrent);
        if (isSingle) slotClasses.push(styles.isSingle);

        return (
          <div
            key={v}
            className={slotClasses.join(" ")}
            style={{ "--slot-x": `${offset * 100}%` } as React.CSSProperties}
            // The neighbours are on stage but off-screen. Without this their
            // hotspots are still links: tabbable, and read out as if they were
            // on the page in front of you.
            inert={offset !== 0}
          >
            {view.pages.map((i) => {
              const page = pages[i];
              if (!page) return null;

              const pageHotspots = hotspots.filter((h) => h.pageNumber === i + 1);

              const classes = [styles.page];
              // Only ever set by buildMobileViews.
              if (view.half) {
                classes.push(
                  styles.half,
                  view.half === "left" ? styles.halfLeft : styles.halfRight,
                );
              }

              // The scan's own ratio, which sizes .sheet — and .sheet is what
              // the hotspot percentages are measured against. A string: React
              // would append "px" to a bare number.
              const ratio = page.height > 0 ? page.width / page.height : 1 / 1.414;

              return (
                <div
                  key={i}
                  className={classes.join(" ")}
                  data-page-index={i}
                  style={{ "--page-ar": ratio.toFixed(4) } as React.CSSProperties}
                >
                  <div className={styles.sheet}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={(el) => registerImg(i, el)}
                      src={page.src}
                      alt={page.alt ?? `lapa ${i + 1}`}
                      width={page.width}
                      height={page.height}
                      decoding="async"
                      // Only the cover loads with the document;
                      // useBackgroundDecode promotes the rest to eager once the
                      // page is done loading. The cover yields to the hero,
                      // which is the LCP element above it.
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "low" : undefined}
                      draggable={false}
                    />
                    {pageHotspots.map((spot, j) => (
                      <Hotspot key={j} spot={spot} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
