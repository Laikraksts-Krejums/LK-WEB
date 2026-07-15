export type HotspotBox = {
  left: number;
  // Inset from the RIGHT edge, not a width. Width in % is 100 - left - right.
  right: number;
  top: number;
  height: number;
};

export type ReaderPage = {
  src: string;
  width: number;
  height: number;
  alt?: string;
  // A landscape scan holding both pages of one printed opening — still ONE
  // image, so a hotspot's percentages are percentages of the whole spread.
  isSpread: boolean;
};

export type ReaderHotspot = HotspotBox & {
  pageNumber: number;
  href: string;
  label: string;
};

export type Issue = {
  number: number;
  title: string;
  slug: string;
  publishedAt?: string;
  blurb?: string;
  coverUrl?: string;
  pages: ReaderPage[];
  hotspots: ReaderHotspot[];
};

export type IssueSummary = Omit<Issue, "pages" | "hotspots">;
