import "server-only";
import { client } from "@/sanity/client";
import { urlForImage } from "@/sanity/image";
import {
  ALL_ISSUES_QUERY,
  ISSUE_BY_SLUG_QUERY,
  LATEST_ISSUE_QUERY,
  SITE_LINK_URLS_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/sanity/queries";
import { DEV_ISSUE } from "./fixtures";
import { isSpreadImage } from "./pageLayout";
import { r2PublicUrl } from "./r2";
import { SITE_DEFAULTS } from "./site";
import type { Issue, ReaderHotspot } from "./types";

/** Honoured on Cloudflare by the incremental cache + queue in open-next.config.ts. */
export const REVALIDATE_SECONDS = 300;
const cacheOpts = { next: { revalidate: REVALIDATE_SECONDS } };

export type SiteSettings = {
  tagline: string;
  keywords?: string[];
  ogImageUrl?: string;
  faviconUrl?: string;
};

type SanityImageRef = { asset?: { _ref?: string } };
type SanityHotspot = {
  pageNumber: number;
  target: "link" | "custom";
  linkHref?: string;
  customHref?: string;
  label: string;
  left: number;
  right: number;
  top: number;
  height: number;
};
type SanityIssue = {
  number: number;
  title: string;
  slug: string;
  publishedAt?: string;
  blurb?: string;
  coverImage?: SanityImageRef;
  pages?: {
    key: string;
    width?: number;
    height?: number;
    alt?: string;
    layout?: string;
  }[];
  hotspots?: SanityHotspot[];
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const doc = await client
    .fetch(SITE_SETTINGS_QUERY, {}, cacheOpts)
    .catch(() => null);

  return {
    tagline: doc?.tagline ?? SITE_DEFAULTS.tagline,
    keywords: doc?.keywords ?? [...SITE_DEFAULTS.keywords],
    ogImageUrl: doc?.ogImage ? urlForImage(doc.ogImage, 1200) : "/og-image.jpg",
    faviconUrl: doc?.favicon ? urlForImage(doc.favicon, 512) : undefined,
  };
}

/** URLs of every reusable Link, for the site's schema.org sameAs. */
export async function getSiteLinkUrls(): Promise<string[]> {
  return client.fetch(SITE_LINK_URLS_QUERY, {}, cacheOpts).catch(() => []);
}

function resolveHotspot(spot: SanityHotspot): ReaderHotspot | null {
  const href = spot.target === "custom" ? spot.customHref : spot.linkHref;

  if (!href) return null; // the link it points at hasn't been filled in yet

  return {
    pageNumber: spot.pageNumber,
    left: spot.left,
    right: spot.right,
    top: spot.top,
    height: spot.height,
    href,
    label: spot.label,
  };
}

function toIssue(doc: SanityIssue): Issue {
  return {
    number: doc.number,
    title: doc.title,
    slug: doc.slug,
    publishedAt: doc.publishedAt,
    blurb: doc.blurb,
    coverUrl: doc.coverImage ? urlForImage(doc.coverImage, 800) : undefined,
    pages: (doc.pages ?? []).map((page, i) => {
      // The raw dimensions, not the defaults below — so "unmeasured means single"
      // is a decision rather than an accident of 1400 < 1980.
      const isSpread = isSpreadImage(page.layout, page.width, page.height);

      return {
        src: r2PublicUrl(page.key),
        // The fallback box has to match what we just decided the page IS: an
        // unmeasured image an editor marked as a spread would otherwise get a
        // portrait box and render letterboxed inside it.
        width: page.width || (isSpread ? 2800 : 1400),
        height: page.height || 1980,
        alt: page.alt ?? `lapa ${i + 1}`,
        isSpread,
      };
    }),
    hotspots: (doc.hotspots ?? [])
      .map(resolveHotspot)
      .filter((spot): spot is ReaderHotspot => spot !== null),
  };
}

/** Placeholder art is for local work only; production shows an empty state. */
function devFallback(): Issue | null {
  return process.env.NODE_ENV === "production" ? null : DEV_ISSUE;
}

export async function getLatestIssue(): Promise<Issue | null> {
  const doc: SanityIssue | null = await client
    .fetch(LATEST_ISSUE_QUERY, {}, cacheOpts)
    .catch(() => null);

  return doc ? toIssue(doc) : devFallback();
}

export async function getIssueBySlug(slug: string): Promise<Issue | null> {
  const doc: SanityIssue | null = await client
    .fetch(ISSUE_BY_SLUG_QUERY, { slug }, cacheOpts)
    .catch(() => null);

  if (doc) return toIssue(doc);
  const fallback = devFallback();
  return fallback && fallback.slug === slug ? fallback : null;
}

export type IssueSummary = {
  number: number;
  title: string;
  slug: string;
  publishedAt?: string;
  blurb?: string;
  coverUrl?: string;
};

export async function getAllIssues(): Promise<IssueSummary[]> {
  const docs: SanityIssue[] = await client
    .fetch(ALL_ISSUES_QUERY, {}, cacheOpts)
    .catch(() => []);

  if (docs.length === 0) {
    const fallback = devFallback();
    return fallback
      ? [
          {
            number: fallback.number,
            title: fallback.title,
            slug: fallback.slug,
            publishedAt: fallback.publishedAt,
            coverUrl: fallback.coverUrl,
          },
        ]
      : [];
  }

  return docs.map((doc) => ({
    number: doc.number,
    title: doc.title,
    slug: doc.slug,
    publishedAt: doc.publishedAt,
    blurb: doc.blurb,
    coverUrl: doc.coverImage ? urlForImage(doc.coverImage, 800) : undefined,
  }));
}
