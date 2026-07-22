export type PageLayout = "auto" | "single" | "spread";

// Unmeasured uploads assume single — the reverse mis-numbers every page after.
export function isSpreadImage(
  layout: string | undefined,
  width: number | undefined,
  height: number | undefined,
): boolean {
  if (layout === "spread") return true;
  if (layout === "single") return false;
  return !!width && !!height && width > height;
}

/** Printed page numbers by IMAGE INDEX; display only — hotspots stay image-indexed. */
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
