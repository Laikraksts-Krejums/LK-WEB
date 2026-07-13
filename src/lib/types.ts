
export type ReaderPage = {
  src: string;
  width: number;
  height: number;
  alt?: string;
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
