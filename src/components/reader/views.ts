import type { PageNumbering } from "@/lib/pageLayout";

export const MOBILE_QUERY = "(max-width: 780px)";

/** Image indices, not printed page numbers. */
export type View = { pages: number[] };

/**
 * `spreads[i]` is true when image i is a landscape scan of a two-page opening.
 *
 * A spread already IS an opening, so it gets a view to itself: pairing it with a
 * neighbour would show three pages at once, and — worse — the old unconditional
 * `i += 2` stride flipped left/right parity for every pair after it.
 *
 * Front and back cover stay solo, as before: a cover has no facing page.
 */
export function buildDesktopViews(spreads: readonly boolean[]): View[] {
  const count = spreads.length;
  if (count <= 0) return [];
  if (count === 1) return [{ pages: [0] }];

  const views: View[] = [{ pages: [0] }];
  const lastIndex = count - 1;

  let i = 1;
  while (i < lastIndex) {
    if (spreads[i]) {
      views.push({ pages: [i] });
      i += 1;
      continue;
    }

    // Pair only with another single page, and never with the back cover.
    const next = i + 1;
    if (next < lastIndex && !spreads[next]) {
      views.push({ pages: [i, next] });
      i += 2;
    } else {
      views.push({ pages: [i] });
      i += 1;
    }
  }

  views.push({ pages: [lastIndex] });
  return views;
}

/** A spread stays one view, shown whole — readers pinch-zoom it (useZoom). */
export function buildMobileViews(spreads: readonly boolean[]): View[] {
  return Array.from({ length: spreads.length }, (_, i) => ({ pages: [i] }));
}

export function buildViews(
  spreads: readonly boolean[],
  isMobile: boolean,
): View[] {
  return isMobile ? buildMobileViews(spreads) : buildDesktopViews(spreads);
}

export function findViewIndex(views: View[], page: number): number {
  const idx = views.findIndex((v) => v.pages.includes(page));
  return idx < 0 ? 0 : idx;
}

/** Printed page numbers, never image indices — see lib/pageLayout.ts. */
export function pageRangeLabel(view: View, numbering: PageNumbering): string {
  const firstImage = view.pages[0];
  const lastImage = view.pages[view.pages.length - 1];

  const first = numbering.first[firstImage] ?? firstImage + 1;
  const last = numbering.last[lastImage] ?? lastImage + 1;

  return first === last ? `${first}` : `${first}–${last}`;
}
