// Anything an editor should be able to change without a deploy lives in the
// Sanity `siteSettings` singleton (or the `siteLink` list), not here.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://laikrakstskrejums.lv";

// Only the real site at the apex domain sets this. Staging and the interim
// *.workers.dev production deploy are both noindex: a second crawlable copy of
// the magazine would split its search results against itself.
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const SITE_NAME = "krējums.";

/** Fallbacks used until siteSettings exists in Sanity. */
export const SITE_DEFAULTS = {
  title: "krējums. - nenoliec karoti.",
  tagline:
    "lai arī kur pasaulē mēs atrastos, visiem pienākas trekna karote Latvijas stāsta.",
  keywords: [
    "krējums",
    "laikraksts krējums",
    "latviešu laikraksts",
    "latviešu žurnāls",
    "krejums magazine",
    "nenoliec karoti",
  ],
} as const;
