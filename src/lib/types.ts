
export type ReaderPage = {
  src: string;
  width: number;
  height: number;
  alt?: string;
  /**
   * A landscape scan holding both pages of one printed opening. Resolved on the
   * server from the scan's dimensions and the editor's override (lib/pageLayout).
   * It is still ONE image: hotspot percentages on it are percentages of the
   * whole spread.
   */
  isSpread: boolean;
};


export type ReaderHotspot = {
  pageNumber: number;
  left: number;
  right: number;
  top: number;
  height: number;
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
