"use client";

import { useSyncExternalStore } from "react";
import { MOBILE_QUERY } from "@/domain/breakpoints";

const mql = typeof window !== "undefined" ? window.matchMedia(MOBILE_QUERY) : null;

function subscribe(onChange: () => void) {
  mql?.addEventListener("change", onChange);
  return () => mql?.removeEventListener("change", onChange);
}

const getSnapshot = () => mql?.matches ?? false;

const getServerSnapshot = () => false;

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
