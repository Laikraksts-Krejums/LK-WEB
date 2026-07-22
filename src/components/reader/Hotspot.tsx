import { boxToStyle } from "@/domain/box";
import type { ReaderHotspot } from "@/domain/types";
import styles from "./Reader.module.css";

/** No onClick by design — useZoom's closest(hotspotClass) guard handles the click order. */
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
