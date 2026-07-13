import type { ReaderHotspot } from "@/lib/types";
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
      style={{
        left: `${spot.left}%`,
        right: `${spot.right}%`,
        top: `${spot.top}%`,
        height: `${spot.height}%`,
      }}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
    />
  );
}
