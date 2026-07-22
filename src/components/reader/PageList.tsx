import type { ReaderHotspot, ReaderPage } from "@/domain/types";
import { Hotspot } from "./Hotspot";
import type { View } from "@/domain/views";
import styles from "./Reader.module.css";

type PageListProps = {
  pages: ReaderPage[];
  hotspots: ReaderHotspot[];
  views: View[];
  current: number;
  registerImg: (index: number, el: HTMLImageElement | null) => void;
};

const NEAR = 1;

/** Every page stays MOUNTED: unmounting an <img> evicts its bitmap and turns
    flips back into decodes — flipping must produce zero new image requests. */
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
            // Off-screen neighbours' hotspots must not be tabbable links.
            inert={offset !== 0}
          >
            {view.pages.map((i) => {
              const page = pages[i];
              if (!page) return null;

              const pageHotspots = hotspots.filter((h) => h.pageNumber === i + 1);

              const classes = [styles.page];
              if (view.half) {
                classes.push(
                  styles.half,
                  view.half === "left" ? styles.halfLeft : styles.halfRight,
                );
              }

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
                      // Every page fetches up front; a hidden lazy image never
                      // does, and that is what left pages white until revealed.
                      loading="eager"
                      fetchPriority={i === 0 ? "high" : "low"}
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
