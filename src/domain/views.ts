import type { PageNumbering } from "./page";

/** half: mobile shows one side of a spread scan; desktop never sets it. */
export type View = { pages: number[]; half?: "left" | "right" };

function buildDesktopViews(spreads: readonly boolean[]): View[] {
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

function buildMobileViews(spreads: readonly boolean[]): View[] {
  return spreads.flatMap((spread, i) =>
    spread
      ? [
          { pages: [i], half: "left" as const },
          { pages: [i], half: "right" as const },
        ]
      : [{ pages: [i] }],
  );
}

export function buildViews(spreads: readonly boolean[], isMobile: boolean): View[] {
  return isMobile ? buildMobileViews(spreads) : buildDesktopViews(spreads);
}

export function findViewIndex(views: View[], page: number): number {
  const idx = views.findIndex((v) => v.pages.includes(page));
  return idx < 0 ? 0 : idx;
}

/** Printed page numbers, never image indices — see ./page. */
export function pageRangeLabel(view: View, numbering: PageNumbering): string {
  const firstImage = view.pages[0];
  const lastImage = view.pages[view.pages.length - 1];

  const first = numbering.first[firstImage] ?? firstImage + 1;
  const last = numbering.last[lastImage] ?? lastImage + 1;

  if (view.half) return `${view.half === "left" ? first : last}`;

  return first === last ? `${first}` : `${first}–${last}`;
}
