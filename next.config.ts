import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // The Next image optimizer does not run on Workers, and the reader needs raw
  // <img> access for .decode() anyway. Sanity's CDN resizes covers/hero.
  images: { unoptimized: true },

  // Do NOT add a `webpack` key: Next 16 fails the Turbopack build if one exists,
  // and the OpenNext adapter builds with Turbopack.

  async headers() {
    if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true") return [];
    // robots.txt is a request a crawler may ignore; this header is not.
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  async redirects() {
    // Two rules, not one: with `:path*` the bare /studio matches zero segments
    // and Next emits the literal "/admin/:path*" as the Location header.
    return [
      { source: "/studio", destination: "/admin", permanent: true },
      { source: "/studio/:path+", destination: "/admin/:path+", permanent: true },
    ];
  },
};

// Gives `next dev` the wrangler.jsonc bindings via Miniflare, so the R2 upload
// loop is testable without a Cloudflare account.
initOpenNextCloudflareForDev();

export default nextConfig;
