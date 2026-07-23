import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // The image optimizer doesn't run on Workers; Sanity's CDN resizes instead.
  images: { unoptimized: true },

  // Do NOT add a `webpack` key: Next 16 fails the Turbopack build if one exists.

  async headers() {
    if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true") return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  async redirects() {
    return [
      // Send www and everything under it to the bare domain, so search engines
      // see one canonical site instead of two identical copies. Two rules for
      // the same reason as /studio below: on Workers, `:path*` matching zero
      // segments emits the literal ":path*" in the Location header, so the bare
      // www root gets its own static rule.
      {
        source: "/",
        has: [{ type: "host", value: "www.laikrakstskrejums.lv" }],
        destination: "https://laikrakstskrejums.lv/",
        permanent: true,
      },
      {
        source: "/:path+",
        has: [{ type: "host", value: "www.laikrakstskrejums.lv" }],
        destination: "https://laikrakstskrejums.lv/:path+",
        permanent: true,
      },
      // Two rules, not one: with `:path*` the bare /studio matches zero segments
      // and Next emits the literal "/admin/:path*" as the Location header.
      { source: "/studio", destination: "/admin", permanent: true },
      { source: "/studio/:path+", destination: "/admin/:path+", permanent: true },
    ];
  },
};

// Gives `next dev` the wrangler.jsonc bindings via Miniflare.
initOpenNextCloudflareForDev();

export default nextConfig;
