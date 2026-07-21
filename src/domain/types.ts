export type HotspotBox = {
  left: number;
  // Inset from the RIGHT edge, not a width.
  right: number;
  top: number;
  height: number;
};

export type ReaderPage = {
  src: string;
  width: number;
  height: number;
  alt?: string;
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
  edition?: string;
  slug: string;
  publishedAt?: string;
  blurb?: string;
  coverUrl?: string;
  pages: ReaderPage[];
  hotspots: ReaderHotspot[];
};

export type IssueSummary = Omit<Issue, "pages" | "hotspots">;
