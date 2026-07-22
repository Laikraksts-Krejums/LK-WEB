"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { View } from "@/domain/views";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

// Decode this many views on each side of the current one up front; everything
// past it trickles in during idle time so a jump ahead never lands undecoded.
const NEAR_VIEWS = 2;
const NEAR_CONCURRENCY = 3;

function afterLoad(fn: () => void): () => void {
  if (document.readyState === "complete") {
    const id = setTimeout(fn, 0);
    return () => clearTimeout(id);
  }
  window.addEventListener("load", fn, { once: true });
  return () => window.removeEventListener("load", fn);
}

function decode(img: HTMLImageElement): Promise<unknown> {
  // A lazy image in a display:none slot never fetches; eager is what starts it.
  img.loading = "eager";
  if (img.decode) return img.decode().catch(() => {});
  return new Promise<void>((resolve) => {
    if (img.complete) resolve();
    else img.addEventListener("load", () => resolve(), { once: true });
  });
}

/** Page indices ordered by view distance from `current`, nearest first. */
function priorityOrder(views: View[], current: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const push = (v: number) =>
    views[v]?.pages.forEach((i) => {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    });

  push(current);
  for (let d = 1; d < views.length; d++) {
    push(current - d);
    push(current + d);
  }
  return order;
}

/**
 * Preloads every page outward from the current view: the near window decodes
 * immediately so turning never outruns it, the tail fills in during idle time.
 */
export function usePagePreload(
  imgRefs: RefObject<(HTMLImageElement | null)[]>,
  views: View[],
  current: number,
  enabled: boolean,
) {
  const requested = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const order = priorityOrder(views, current);

    const near = new Set<number>();
    for (let v = current - NEAR_VIEWS; v <= current + NEAR_VIEWS; v++) {
      views[v]?.pages.forEach((i) => near.add(i));
    }

    const run = (i: number): Promise<unknown> => {
      const img = imgRefs.current?.[i];
      if (cancelled || !img || requested.current.has(i)) return Promise.resolve();
      requested.current.add(i);
      return decode(img);
    };

    // Near window: decode now, a few in flight at a time.
    const nearQueue = order.filter((i) => near.has(i));
    let cursor = 0;
    const pump = (): Promise<unknown> => {
      if (cancelled || cursor >= nearQueue.length) return Promise.resolve();
      return run(nearQueue[cursor++]).then(pump);
    };
    for (let k = 0; k < NEAR_CONCURRENCY; k++) pump();

    // Tail: trickle in during idle time, and only after the page has loaded.
    const tail = order.filter((i) => !near.has(i));
    let t = 0;
    const idle = () => {
      if (cancelled || t >= tail.length) return;
      run(tail[t++]).then(() => {
        const w = window as IdleWindow;
        if (w.requestIdleCallback) w.requestIdleCallback(idle, { timeout: 500 });
        else setTimeout(idle, 10);
      });
    };
    const cancelStart = afterLoad(idle);

    return () => {
      cancelled = true;
      cancelStart();
    };
  }, [imgRefs, views, current, enabled]);
}
