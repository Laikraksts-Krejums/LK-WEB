"use client";

import { useEffect, type RefObject } from "react";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

function afterLoad(fn: () => void): () => void {
  if (document.readyState === "complete") {
    const id = setTimeout(fn, 0);
    return () => clearTimeout(id);
  }
  window.addEventListener("load", fn, { once: true });
  return () => window.removeEventListener("load", fn);
}

/** Decodes every page ahead of time; waits for `load` so the scans don't starve the LCP hero. */
export function useBackgroundDecode(
  imgRefs: RefObject<(HTMLImageElement | null)[]>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let i = 0;

    const decodeNext = () => {
      if (cancelled || i >= imgRefs.current.length) return;
      const img = imgRefs.current[i++];
      if (!img) {
        decodeNext();
        return;
      }

      // A lazy image inside display:none never loads; eager is what starts the fetch.
      img.loading = "eager";

      const decoded: Promise<unknown> = img.decode
        ? img.decode().catch(() => {})
        : new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else img.addEventListener("load", () => resolve(), { once: true });
          });

      decoded.then(() => {
        if (cancelled) return;
        const w = window as IdleWindow;
        if (w.requestIdleCallback)
          w.requestIdleCallback(decodeNext, { timeout: 500 });
        else setTimeout(decodeNext, 10);
      });
    };

    const cancelStart = afterLoad(decodeNext);
    return () => {
      cancelled = true;
      cancelStart();
    };
  }, [imgRefs, enabled]);
}
