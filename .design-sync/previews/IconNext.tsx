import { IconNext } from "lk-web";
import pill from "@/components/ui/pill.module.css";

export function InButton() {
  return (
    <button type="button" className={pill.pill} aria-label="nākošā lapa">
      <IconNext />
    </button>
  );
}

export function Disabled() {
  return (
    <button type="button" className={pill.pill} aria-label="nākošā lapa" disabled>
      <IconNext />
    </button>
  );
}
