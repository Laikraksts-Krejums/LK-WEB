"use client";

import { useSyncExternalStore } from "react";
import { MOBILE_QUERY } from "./views";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;

/**
 * The server guesses "not mobile" and the client corrects on hydration. That is
 * only invisible because view 0 (the cover) renders identically in both modes
 * and the reader always opens on it — not because the guess is any good.
 */
const getServerSnapshot = () => false;

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
