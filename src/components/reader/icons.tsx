type IconProps = {
  className?: string;
};

const svgBase = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

export function IconPrev({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className} fill="currentColor">
      <polygon points="16,4 16,20 6,12" />
    </svg>
  );
}

export function IconNext({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className} fill="currentColor">
      <polygon points="8,4 8,20 18,12" />
    </svg>
  );
}

/** Lens as a filled ring: outer disc minus inner disc, evenodd. */
const LENS_RING =
  "M4,11 A7,7 0 1,0 18,11 A7,7 0 1,0 4,11 Z M6,11 A5,5 0 1,0 16,11 A5,5 0 1,0 6,11 Z";

export function IconZoomIn({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d={LENS_RING} fillRule="evenodd" fill="currentColor" />
      <line
        x1="16"
        y1="16"
        x2="21"
        y2="21"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="11"
        x2="14"
        y2="11"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <line
        x1="11"
        y1="8"
        x2="11"
        y2="14"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconZoomOut({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d={LENS_RING} fillRule="evenodd" fill="currentColor" />
      <line
        x1="16"
        y1="16"
        x2="21"
        y2="21"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="11"
        x2="14"
        y2="11"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconFullscreen({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className} fill="currentColor">
      <polygon points="3,3 3,9 5,9 5,5 9,5 9,3" />
      <polygon points="21,3 21,9 19,9 19,5 15,5 15,3" />
      <polygon points="3,21 3,15 5,15 5,19 9,19 9,21" />
      <polygon points="21,21 21,15 19,15 19,19 15,19 15,21" />
    </svg>
  );
}
