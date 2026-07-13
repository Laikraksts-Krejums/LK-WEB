"use client";

import { useEffect, type RefObject } from "react";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

/** Decodes every page in the background so showing one later is a paint, not a decode. */
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

      // A lazy image inside a display:none container never loads, and decode()
      // will not force it — it just rejects. Promoting to eager is what starts
      // the fetch. Sequential, so pages still arrive one at a time.
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
        if (w.requestIdleCallback) w.requestIdleCallback(decodeNext, { timeout: 200 });
        else setTimeout(decodeNext, 10);
      });
    };

    decodeNext();
    return () => {
      cancelled = true;
    };
  }, [imgRefs, enabled]);
}
