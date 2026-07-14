import { IconPrev } from "lk-web";
import pill from "@/components/ui/pill.module.css";

export function InButton() {
  return (
    <button type="button" className={pill.pill} aria-label="iepriekšējā lapa">
      <IconPrev />
    </button>
  );
}

export function Disabled() {
  return (
    <button type="button" className={pill.pill} aria-label="iepriekšējā lapa" disabled>
      <IconPrev />
    </button>
  );
}
