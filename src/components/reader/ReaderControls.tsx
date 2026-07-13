"use client";

import styles from "./Reader.module.css";

type ControlsProps = {
  label: string;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  isZoomed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoom: () => void;
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
  onZoom,
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
        ←
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
        →
      </button>
      <button
        className={styles.btn}
        onClick={onZoom}
        aria-label="tuvināt lapu"
        aria-pressed={isZoomed}
      >
        tuvināt
      </button>
      <button
        className={styles.btn}
        onClick={onFullscreen}
        aria-label="pilnekrāns"
      >
        pilnekrāns
      </button>
    </div>
  );
}
