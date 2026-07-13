"use client";

import dynamic from "next/dynamic";

/**
 * `ssr: false` is what keeps this deployable. "use client" alone is not enough:
 * Next still server-renders client components, so all of `sanity` would land in
 * the Worker — 4.0 MB gzip, past the 3 MiB free-tier limit. Browser-only loading
 * keeps it in static assets. Measured 1.07 MB with this; check
 * `wrangler deploy --dry-run` if you change it.
 */
const StudioClient = dynamic(() => import("./StudioClient"), { ssr: false });

export default function StudioPage() {
  return <StudioClient />;
}
