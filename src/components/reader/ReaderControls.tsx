"use client";

import {
  IconFullscreen,
  IconNext,
  IconPrev,
  IconZoomIn,
  IconZoomOut,
} from "./icons";
import styles from "./Reader.module.css";

type ControlsProps = {
  label: string;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  isZoomed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFullscreen: () => void;
};

export function ReaderControls({
  label,
  totalPages,
  canPrev,
  canNext,
  isZoomed,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onFullscreen,
}: ControlsProps) {
  return (
    <div className={styles.controls} role="toolbar" aria-label="navigācija">
      <button
        className={styles.btn}
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="iepriekšējā lapa"
      >
        <IconPrev />
      </button>
      <span className={styles.indicator} aria-live="polite">
        {label} / {totalPages}
      </span>
      <button
        className={styles.btn}
        onClick={onNext}
        disabled={!canNext}
        aria-label="nākošā lapa"
      >
        <IconNext />
      </button>
      <button
        className={styles.btn}
        onClick={onZoomOut}
        disabled={!isZoomed}
        aria-label="tālināt"
      >
        <IconZoomOut />
      </button>
      <button className={styles.btn} onClick={onZoomIn} aria-label="tuvināt">
        <IconZoomIn />
      </button>
      <button
        className={styles.btn}
        onClick={onFullscreen}
        aria-label="pilnekrāns"
      >
        <IconFullscreen />
      </button>
    </div>
  );
}
