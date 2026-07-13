import "server-only";
import { client } from "@/sanity/client";
import { urlForImage } from "@/sanity/image";
import {
  ALL_ISSUES_QUERY,
  ISSUE_BY_SLUG_QUERY,
  LATEST_ISSUE_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/sanity/queries";
import { DEV_ISSUE } from "./fixtures";
import { r2PublicUrl } from "./r2";
import { SITE_DEFAULTS } from "./site";
import type { Issue, ReaderHotspot } from "./types";

/** Honoured on Cloudflare by the incremental cache + queue in open-next.config.ts. */
export const REVALIDATE_SECONDS = 300;
const cacheOpts = { next: { revalidate: REVALIDATE_SECONDS } };

export type SiteSettings = {
  tagline: string;
  instagramUrl?: string;
  facebookUrl?: string;
  email?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImageUrl?: string;
};

type SanityImageRef = { asset?: { _ref?: string } };
type SanityHotspot = {
  pageNumber: number;
  target: "instagram" | "facebook" | "email" | "custom";
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
  heroImage?: SanityImageRef;
  pages?: { key: string; width?: number; height?: number; alt?: string }[];
  hotspots?: SanityHotspot[];
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const doc = await client
    .fetch(SITE_SETTINGS_QUERY, {}, cacheOpts)
    .catch(() => null);

  return {
    tagline: doc?.tagline ?? SITE_DEFAULTS.tagline,
    instagramUrl: doc?.instagramUrl ?? SITE_DEFAULTS.instagramUrl,
    facebookUrl: doc?.facebookUrl ?? undefined,
    email: doc?.email ?? SITE_DEFAULTS.email,
    metaDescription: doc?.metaDescription ?? SITE_DEFAULTS.tagline,
    keywords: doc?.keywords ?? [...SITE_DEFAULTS.keywords],
    ogImageUrl: doc?.ogImage ? urlForImage(doc.ogImage, 1200) : "/og-image.jpg",
  };
}

/**
 * Resolved here rather than stored on the hotspot, so changing the Instagram
 * handle in Site Settings updates every hotspot in every back issue at once.
 */
function resolveHotspot(
  spot: SanityHotspot,
  settings: SiteSettings,
): ReaderHotspot | null {
  const href =
    spot.target === "custom"
      ? spot.customHref
      : spot.target === "email"
        ? settings.email && `mailto:${settings.email}`
        : spot.target === "facebook"
          ? settings.facebookUrl
          : settings.instagramUrl;

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

function toIssue(doc: SanityIssue, settings: SiteSettings): Issue {
  return {
    number: doc.number,
    title: doc.title,
    slug: doc.slug,
    publishedAt: doc.publishedAt,
    blurb: doc.blurb,
    coverUrl: doc.coverImage ? urlForImage(doc.coverImage, 800) : undefined,
    heroUrl: doc.heroImage ? urlForImage(doc.heroImage, 900) : undefined,
    pages: (doc.pages ?? []).map((page, i) => ({
      src: r2PublicUrl(page.key),
      width: page.width || 1400,
      height: page.height || 1980,
      alt: page.alt ?? `lapa ${i + 1}`,
    })),
    hotspots: (doc.hotspots ?? [])
      .map((spot) => resolveHotspot(spot, settings))
      .filter((spot): spot is ReaderHotspot => spot !== null),
  };
}

/** Placeholder art is for local work only; production shows an empty state. */
function devFallback(): Issue | null {
  return process.env.NODE_ENV === "production" ? null : DEV_ISSUE;
}

export async function getLatestIssue(): Promise<Issue | null> {
  const settings = await getSiteSettings();
  const doc: SanityIssue | null = await client
    .fetch(LATEST_ISSUE_QUERY, {}, cacheOpts)
    .catch(() => null);

  return doc ? toIssue(doc, settings) : devFallback();
}

export async function getIssueBySlug(slug: string): Promise<Issue | null> {
  const settings = await getSiteSettings();
  const doc: SanityIssue | null = await client
    .fetch(ISSUE_BY_SLUG_QUERY, { slug }, cacheOpts)
    .catch(() => null);

  if (doc) return toIssue(doc, settings);
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
