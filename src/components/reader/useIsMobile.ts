"use client";

import { useSyncExternalStore } from "react";
import { MOBILE_QUERY } from "@/domain/breakpoints";

// One MediaQueryList, not a fresh one per getSnapshot call (useSyncExternalStore
// calls it on every render). null on the server, where getServerSnapshot is used.
const mql = typeof window !== "undefined" ? window.matchMedia(MOBILE_QUERY) : null;

function subscribe(onChange: () => void) {
  mql?.addEventListener("change", onChange);
  return () => mql?.removeEventListener("change", onChange);
}

const getSnapshot = () => mql?.matches ?? false;

/**
 * The server guesses "not mobile" and the client corrects on hydration. That is
 * only invisible because view 0 (the cover) renders identically in both modes
 * and the reader always opens on it — not because the guess is any good.
 */
const getServerSnapshot = () => false;

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
