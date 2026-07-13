import type { ReaderHotspot, ReaderPage } from "@/lib/types";
import { Hotspot } from "./Hotspot";
import styles from "./Reader.module.css";

type PageListProps = {
  pages: ReaderPage[];
  hotspots: ReaderHotspot[];
  visible: number[];
  registerImg: (index: number, el: HTMLImageElement | null) => void;
};

/**
 * Every page stays mounted; visibility is a CSS class.
 *
 * Do NOT render only the visible pages. Flipping is instant because all N
 * bitmaps are decoded and resident — unmounting an <img> lets the browser evict
 * the bitmap and turns every page turn back into a decode. Regression test:
 * flipping through the issue must produce zero new image requests.
 */
export function PageList({
  pages,
  hotspots,
  visible,
  registerImg,
}: PageListProps) {
  const visibleSet = new Set(visible);
  // Two IMAGES side by side — distinct from page.isSpread, which is one image
  // holding two printed pages. Only drives the gutter shadows: a spread scan
  // already contains the real fold, so it never gets a synthetic one.
  const isPair = visible.length === 2;

  return (
    <>
      {pages.map((page, i) => {
        const isVisible = visibleSet.has(i);
        const pageHotspots = hotspots.filter((h) => h.pageNumber === i + 1);

        const classes = [styles.page];
        if (isVisible) classes.push(styles.isVisible);
        if (isPair && isVisible) {
          classes.push(i === visible[0] ? styles.spineLeft : styles.spineRight);
        }

        // The scan's own ratio. The CSS sizes .page from it, which is what keeps
        // .page exactly the image's box — and the hotspots below are percentages
        // of that box, so the equality is what lands them on the printed thing
        // they point at. A string: React would append "px" to a bare number.
        const ratio = page.height > 0 ? page.width / page.height : 1 / 1.414;

        return (
          <div
            key={i}
            className={classes.join(" ")}
            data-page-index={i}
            style={{ "--page-ar": ratio.toFixed(4) } as React.CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(el) => registerImg(i, el)}
              src={page.src}
              alt={page.alt ?? `lapa ${i + 1}`}
              width={page.width}
              height={page.height}
              decoding="async"
              // Only the cover loads with the document; useBackgroundDecode
              // promotes the rest to eager once the page is done loading. The
              // cover yields to the hero, which is the LCP element above it.
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "low" : undefined}
              draggable={false}
            />
            {pageHotspots.map((spot, j) => (
              <Hotspot key={j} spot={spot} />
            ))}
          </div>
        );
      })}
    </>
  );
}
