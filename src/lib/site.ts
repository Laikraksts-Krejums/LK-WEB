// Anything an editor should be able to change without a deploy lives in the
// Sanity `siteSettings` singleton, not here.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://laikrakstskrejums.lv";

export const SITE_NAME = "krējums.";

/** Fallbacks used until siteSettings exists in Sanity. */
export const SITE_DEFAULTS = {
  title: "krējums. — nenoliec karoti.",
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
  instagramUrl: "https://www.instagram.com/laikrakstskrejums/",
  email: "laikraksts.krejums@gmail.com",
} as const;
