export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://laikrakstskrejums.lv";

// Only the real apex site sets this — a second crawlable copy splits search results.
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const SITE_NAME = "krējums.";

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
