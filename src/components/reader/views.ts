import type { PageNumbering } from "@/lib/pageLayout";

export const MOBILE_QUERY = "(max-width: 780px)";

/**
 * Image indices, not printed page numbers.
 *
 * `half` shows one side of a spread scan: mobile splits a two-page opening back
 * into the two printed pages it holds, because a whole spread on a phone is
 * about 250px tall and unreadable without zooming on every single page. Desktop
 * never sets it — there a spread is shown as the opening it is.
 */
export type View = { pages: number[]; half?: "left" | "right" };

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

/**
 * One printed page per view: a spread is split back into its two halves. The
 * scan is still ONE image and one <img> — PageList slides it under a
 * half-width window — so this costs no extra request and no extra bitmap.
 *
 * The split is a clean 50%: a two-page scan is two equal pages, and the gutter
 * is its centre by construction.
 */
export function buildMobileViews(spreads: readonly boolean[]): View[] {
  return spreads.flatMap((spread, i) =>
    spread
      ? [
          { pages: [i], half: "left" as const },
          { pages: [i], half: "right" as const },
        ]
      : [{ pages: [i] }],
  );
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

  // Half a spread is exactly one printed page — the left one or the right one.
  if (view.half) return `${view.half === "left" ? first : last}`;

  return first === last ? `${first}` : `${first}–${last}`;
}
