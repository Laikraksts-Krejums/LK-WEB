/**
 * One uploaded image is one printed page — unless it is a landscape scan of a
 * two-page spread, in which case one image is two printed pages. Shared by the
 * server (lib/issues.ts) and the Studio (schemaTypes/r2Image.tsx), so the
 * preview an editor sees cannot disagree with what the reader does.
 */

export type PageLayout = "auto" | "single" | "spread";

/**
 * `layout` is the editor's override; `auto` — and `undefined`, which is every
 * page uploaded before the field existed — reads the shape of the scan itself.
 *
 * Missing or zero dimensions mean the upload never got measured (useR2Upload's
 * `measure()` returns 0×0 on failure). Assume single: a spread shown as a single
 * is merely small, while a single shown as a spread mis-numbers every page after
 * it.
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
 * Printed page numbers, indexed by IMAGE INDEX. Printed numbering runs ahead of
 * image indices after the first spread.
 *
 * Display only. Hotspots are addressed by image index (hotspot.pageNumber ==
 * image index + 1, see PageList and HotspotsInput) and must stay that way —
 * re-keying them to printed numbers would be a breaking data migration. Nothing
 * here may be used to look a hotspot up.
 */
export type PageNumbering = {
  /** Printed number of the first printed page in image i. */
  first: number[];
  /** Printed number of the last printed page in image i — same as `first` unless i is a spread. */
  last: number[];
  /** Printed pages in the whole issue. */
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
