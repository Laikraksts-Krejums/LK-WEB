export const MOBILE_QUERY = "(max-width: 780px)";

export type View = { pages: number[] };


export function buildDesktopViews(pageCount: number): View[] {
  if (pageCount <= 0) return [];
  if (pageCount === 1) return [{ pages: [0] }];

  const views: View[] = [{ pages: [0] }];
  const lastIndex = pageCount - 1;

  for (let i = 1; i < lastIndex; i += 2) {
    const next = i + 1;
    views.push(next <= lastIndex - 1 ? { pages: [i, next] } : { pages: [i] });
  }

  views.push({ pages: [lastIndex] });
  return views;
}

export function buildMobileViews(pageCount: number): View[] {
  return Array.from({ length: pageCount }, (_, i) => ({ pages: [i] }));
}

export function buildViews(pageCount: number, isMobile: boolean): View[] {
  return isMobile
    ? buildMobileViews(pageCount)
    : buildDesktopViews(pageCount);
}

export function findViewIndex(views: View[], page: number): number {
  const idx = views.findIndex((v) => v.pages.includes(page));
  return idx < 0 ? 0 : idx;
}

export function pageRangeLabel(view: View): string {
  const first = view.pages[0] + 1;
  const last = view.pages[view.pages.length - 1] + 1;
  return first === last ? `${first}` : `${first}–${last}`;
}
