import { defineQuery } from "next-sanity";

const ISSUE_FIELDS = /* groq */ `
  number,
  title,
  "slug": slug.current,
  publishedAt,
  blurb,
  coverImage,
  pages[]{ key, width, height, alt, layout },
  hotspots[]{
    pageNumber,
    target,
    "linkHref": link->url,
    customHref,
    label,
    left,
    right,
    top,
    height
  }
`;

/** The front issue: highest number wins. */
export const LATEST_ISSUE_QUERY = defineQuery(`
  *[_type == "issue"] | order(number desc)[0]{ ${ISSUE_FIELDS} }
`);

export const ISSUE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "issue" && slug.current == $slug][0]{ ${ISSUE_FIELDS} }
`);

/** Archive listing: no page images, they are not needed for a card. */
export const ALL_ISSUES_QUERY = defineQuery(`
  *[_type == "issue"] | order(number desc){
    number,
    title,
    "slug": slug.current,
    publishedAt,
    blurb,
    coverImage
  }
`);

export const ISSUE_SLUGS_QUERY = defineQuery(`
  *[_type == "issue" && defined(slug.current)].slug.current
`);

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0]{
    tagline,
    keywords,
    ogImage,
    favicon
  }
`);

/** URLs of every reusable Link, for the site's schema.org sameAs. */
export const SITE_LINK_URLS_QUERY = defineQuery(`
  *[_type == "siteLink"].url
`);
