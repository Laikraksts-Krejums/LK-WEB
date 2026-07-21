"use client";

import { IconButton } from "@/components/ui/IconButton";
import {
  IconFullscreen,
  IconNext,
  IconPrev,
  IconZoomIn,
  IconZoomOut,
} from "@/components/ui/icons";

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
    // z-10: a zoomed spread would otherwise paint over the zoom-out button.
    <div
      className="relative z-10 mx-auto mt-7 flex w-fit max-w-full flex-wrap items-center justify-center gap-[clamp(0.4rem,1.6vw,0.9rem)] rounded-xl border border-ink bg-cream-deep px-[12px] py-[6px] font-mono backdrop-blur-[3px] mobile:gap-[0.4rem]"
      role="group"
      aria-label="navigācija"
    >
      <IconButton onClick={onPrev} disabled={!canPrev} aria-label="iepriekšējā lapa">
        <IconPrev />
      </IconButton>
      {/* min-w: a growing label re-centres the capsule and moves the arrows mid-click. */}
      <span
        className="min-w-[8em] text-center text-[0.85rem] font-bold tracking-[0.05em] text-ink-soft tabular-nums"
        aria-live="polite"
      >
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
