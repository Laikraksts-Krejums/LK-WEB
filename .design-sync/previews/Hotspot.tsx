import { Hotspot } from "lk-web";
import styles from "@/components/reader/Reader.module.css";

const SCAN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='700' height='990'>
      <rect width='100%' height='100%' fill='#fbf7f0'/>
      <rect x='40' y='60' width='620' height='40' fill='#30302e' opacity='0.12'/>
      <rect x='40' y='140' width='620' height='700' fill='#30302e' opacity='0.06'/>
    </svg>`,
  );

/**
 * Two hotspots over one scanned spread — one on each printed page, matching
 * how PageList composes Hotspot inside `.sheet`. The overlay itself paints
 * nothing until hover (by design, see the component's own doc comment);
 * this preview shows the scan it sits on top of.
 */
export function OnSpread() {
  return (
    <div style={{ width: 350, position: "relative" }}>
      <div className={styles.sheet}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SCAN} alt="" style={{ display: "block", width: "100%" }} />
        <Hotspot
          spot={{
            pageNumber: 1,
            left: 8,
            right: 55,
            top: 20,
            height: 45,
            href: "/numuri/12/1",
            label: "lasīt rakstu 1. lappusē",
          }}
        />
        <Hotspot
          spot={{
            pageNumber: 2,
            left: 55,
            right: 8,
            top: 55,
            height: 30,
            href: "https://example.com/atsauce",
            label: "ārēja atsauce",
          }}
        />
      </div>
    </div>
  );
}
