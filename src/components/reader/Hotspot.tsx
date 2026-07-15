import { boxToStyle } from "@/domain/box";
import type { ReaderHotspot } from "@/domain/types";
import styles from "./Reader.module.css";

/**
 * No click handler by design: React dispatches at the root, after the reader's
 * native click listener on the spread has already turned the page. The
 * `closest('.hotspot')` guard in useZoom is what prevents that.
 */
export function Hotspot({ spot }: { spot: ReaderHotspot }) {
  const isExternal = spot.href.startsWith("http");

  return (
    <a
      href={spot.href}
      className={styles.hotspot}
      aria-label={spot.label}
      style={boxToStyle(spot)}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
    />
  );
}
