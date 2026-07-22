"use client";

import dynamic from "next/dynamic";

/** ssr:false keeps this deployable: "use client" alone still server-renders,
    landing 4 MB of `sanity` in the Worker (3 MiB limit). `wrangler deploy --dry-run`. */
const StudioClient = dynamic(() => import("./StudioClient"), { ssr: false });

export default function StudioPage() {
  return <StudioClient />;
}
