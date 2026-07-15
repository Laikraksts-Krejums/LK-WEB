"use client";

import { IconButton } from "@/components/ui/IconButton";
import {
  IconFullscreen,
  IconNext,
  IconPrev,
  IconZoomIn,
  IconZoomOut,
} from "@/components/ui/icons";
import styles from "./Reader.module.css";

type ControlsProps = {
  label: string;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  isZoomed: boolean;
  isFullscreen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFullscreen: () => void;
};

// role="group", not "toolbar": the arrow keys turn pages (useZoom), so we do not
// implement the roving-tabindex focus movement a toolbar promises.
export function ReaderControls({
  label,
  totalPages,
  canPrev,
  canNext,
  isZoomed,
  isFullscreen,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onFullscreen,
}: ControlsProps) {
  return (
    <div className={styles.controls} role="group" aria-label="navigācija">
      <IconButton onClick={onPrev} disabled={!canPrev} aria-label="iepriekšējā lapa">
        <IconPrev />
      </IconButton>
      <span className={styles.indicator} aria-live="polite">
        {label} / {totalPages}
      </span>
      <IconButton onClick={onNext} disabled={!canNext} aria-label="nākošā lapa">
        <IconNext />
      </IconButton>
      <IconButton onClick={onZoomOut} disabled={!isZoomed} aria-label="tālināt">
        <IconZoomOut />
      </IconButton>
      <IconButton onClick={onZoomIn} aria-label="tuvināt">
        <IconZoomIn />
      </IconButton>
      <IconButton
        onClick={onFullscreen}
        aria-pressed={isFullscreen}
        aria-label={isFullscreen ? "iziet no pilnekrāna" : "pilnekrāns"}
      >
        <IconFullscreen />
      </IconButton>
    </div>
  );
}
