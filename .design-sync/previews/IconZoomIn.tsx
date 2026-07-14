import { IconZoomIn } from "lk-web";
import pill from "@/components/ui/pill.module.css";

export function InButton() {
  return (
    <button type="button" className={pill.pill} aria-label="tuvināt">
      <IconZoomIn />
    </button>
  );
}

