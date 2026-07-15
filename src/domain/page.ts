// One uploaded image is one printed page — unless it is a landscape scan of a
// two-page spread, in which case one image is two printed pages. Shared by the
// server mapper and the Studio, so the editor's preview cannot disagree with
// the reader.

export type PageLayout = "auto" | "single" | "spread";

/**
 * `layout` is the editor's override; `auto`/`undefined` reads the scan's shape.
 * Missing or zero dimensions mean the upload was never measured — assume single:
 * a spread shown single is merely small, but a single shown as a spread
 * mis-numbers every page after it.
 */
export function isSpreadImage(
  layout: string | undefined,
  width: number | undefined,
  height: number | undefined,
): boolean {
  if (layout === "spread") return true;
  if (layout === "single") return false;
  return !!width && !!height && width > height;
}

/**
 * Printed page numbers, indexed by IMAGE INDEX (printed numbering runs ahead of
 * image indices after the first spread). Display only — hotspots are addressed
 * by image index and must stay that way; nothing here may look a hotspot up.
 */
export type PageNumbering = {
  first: number[];
  last: number[];
  total: number;
};

export function buildPageNumbering(spreads: readonly boolean[]): PageNumbering {
  const first: number[] = [];
  const last: number[] = [];
  let n = 1;

  for (const spread of spreads) {
    first.push(n);
    last.push(spread ? n + 1 : n);
    n += spread ? 2 : 1;
  }

  return { first, last, total: n - 1 };
}
