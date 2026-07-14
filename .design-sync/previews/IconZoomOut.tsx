import { IconZoomOut } from "lk-web";
import pill from "@/components/ui/pill.module.css";

export function InButton() {
  return (
    <button type="button" className={pill.pill} aria-label="tālināt">
      <IconZoomOut />
    </button>
  );
}

export function Disabled() {
  return (
    <button type="button" className={pill.pill} aria-label="tālināt" disabled>
      <IconZoomOut />
    </button>
  );
}
