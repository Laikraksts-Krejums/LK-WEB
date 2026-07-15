import type { Metadata } from "next";
import "../globals.css";
import { Masthead } from "@/components/Masthead";
import { R2_PUBLIC_ORIGIN } from "@/lib/r2";
import { SITE_DEFAULTS, SITE_NAME, SITE_URL } from "@/lib/site";
import { getAllIssues, getSiteLinkUrls, getSiteSettings } from "@/server/issues";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL(SITE_URL),
    title: SITE_DEFAULTS.title,
    description: settings.tagline,
    keywords: settings.keywords,
    alternates: { canonical: "/" },
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_DEFAULTS.title,
      description: settings.tagline,
      locale: "lv_LV",
      url: SITE_URL,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_DEFAULTS.title,
      description: settings.tagline,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, linkUrls, issues] = await Promise.all([
    getSiteSettings(),
    getSiteLinkUrls(),
    getAllIssues(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Periodical",
    name: "krējums",
    alternateName: "Laikraksts Krējums",
    inLanguage: "lv",
    url: SITE_URL,
    description: settings.tagline,
    publisher: {
      "@type": "Organization",
      name: "krējums",
      // Only http(s) links (a saved link can be a mailto: address, which is
      // not a valid sameAs target).
      sameAs: linkUrls.filter((url) => url.startsWith("http")),
    },
  };

  return (
    <html lang="lv">
      <head>
        {/* Every image comes from one of these two origins; opening the
            connections early takes the DNS + TLS handshake off the LCP path. */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        {R2_PUBLIC_ORIGIN && <link rel="preconnect" href={R2_PUBLIC_ORIGIN} />}
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="mx-auto min-h-[100dvh] max-w-[1400px] px-[clamp(1rem,3vw,2rem)] pt-[clamp(1rem,2vw,1.5rem)] pb-12 in-fullscreen:p-4">
          <Masthead issues={issues} />
          {children}
        </div>
      </body>
    </html>
  );
}
