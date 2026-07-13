import { SITE_DEFAULTS } from "./site";
import type { Issue } from "./types";

/** Stand-in issue so the reader works with no Sanity project and no R2 bucket. */
const PAGE_COUNT = 18;

export const DEV_ISSUE: Issue = {
  number: 1,
  title: "Nenoliec karoti",
  slug: "i",
  publishedAt: "2025-01-01",
  heroUrl: "/hero-placeholder.jpg",
  coverUrl: "/dev-pages/page-01.jpg",
  pages: Array.from({ length: PAGE_COUNT }, (_, i) => ({
    src: `/dev-pages/page-${String(i + 1).padStart(2, "0")}.jpg`,
    width: 1400,
    height: 1980,
    alt: `lapa ${i + 1}`,
  })),
  hotspots: [
    {
      pageNumber: PAGE_COUNT,
      left: 6,
      right: 4,
      top: 82.5,
      height: 6,
      href: SITE_DEFAULTS.instagramUrl,
      label: "Instagram: @laikrakstskrejums",
    },
    {
      pageNumber: PAGE_COUNT,
      left: 3,
      right: 3,
      top: 90.5,
      height: 7.5,
      href: `mailto:${SITE_DEFAULTS.email}`,
      label: "E-pasts",
    },
  ],
};
