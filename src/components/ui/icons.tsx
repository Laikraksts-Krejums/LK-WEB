type IconProps = {
  className?: string;
};

/* Hand-drawn glyph set (Krējums sketch language): a single wobbly stroke, round
   caps + joins, no fill. One `currentColor`, so the button around it colours it. */
const svgBase = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function IconPrev({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M14.3 4.2 C11 7 8.2 9.6 6.1 11.9 C8.4 14.2 11 16.9 14 20" />
    </svg>
  );
}

export function IconNext({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M9.6 4 C12.9 7 15.8 9.5 18 12 C15.6 14.4 12.8 17 9.9 20.1" />
    </svg>
  );
}

export function IconZoomIn({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M10.5 4.4 C15.4 4 18.7 8.2 17.8 12.4 C17 16.4 12.7 18.6 8.8 17.2 C4.6 15.7 3.4 10.4 6.2 7 C7.4 5.5 8.9 4.7 10.5 4.4 Z" />
      <path d="M16.6 16.2 C18 17.6 19.4 19.1 20.6 20.4" />
      <path d="M8 10.9 C9.7 10.7 12.3 11 14 10.8" />
      <path d="M11 8 C10.8 9.6 11.1 12.2 10.9 13.8" />
    </svg>
  );
}

export function IconZoomOut({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M10.5 4.4 C15.4 4 18.7 8.2 17.8 12.4 C17 16.4 12.7 18.6 8.8 17.2 C4.6 15.7 3.4 10.4 6.2 7 C7.4 5.5 8.9 4.7 10.5 4.4 Z" />
      <path d="M16.6 16.2 C18 17.6 19.4 19.1 20.6 20.4" />
      <path d="M8 10.9 C9.7 10.7 12.3 11 14 10.8" />
    </svg>
  );
}

export function IconFullscreen({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M4.2 8.4 C3.9 6.9 4 5.4 4.1 4.2 C5.5 4 7 4.1 8.3 4.2" />
      <path d="M15.8 4.1 C17.2 4 18.6 4 20 4.2 C20.1 5.5 20.1 7 19.9 8.4" />
      <path d="M20 15.7 C20.1 17.1 20 18.6 19.9 19.9 C18.5 20.1 17 20 15.6 19.9" />
      <path d="M8.3 19.9 C6.9 20.1 5.4 20 4.1 19.9 C3.9 18.5 4 17 4.2 15.6" />
    </svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg {...svgBase} className={className}>
      <path d="M4 7 H20" />
      <path d="M4 12 H20" />
      <path d="M4 17 H20" />
    </svg>
  );
}
