type IconProps = {
  className?: string;
};

const common = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconPrev({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function IconNext({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function IconZoomIn({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M11 8v6M8 11h6M21 21l-4.35-4.35" />
    </svg>
  );
}

export function IconZoomOut({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M8 11h6M21 21l-4.35-4.35" />
    </svg>
  );
}

export function IconFullscreen({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
