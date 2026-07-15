import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings } from "@/server/issues";
import { R2_PUBLIC_ORIGIN } from "@/lib/r2";
import { SITE_DEFAULTS, SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL(SITE_URL),
    title: SITE_DEFAULTS.title,
    description: settings.tagline,
    keywords: settings.keywords ?? [...SITE_DEFAULTS.keywords],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lv">
      <head>
        {/* Every image on the page comes from one of these two. Opening the
            connections early takes the DNS + TLS handshake off the LCP path. */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        {R2_PUBLIC_ORIGIN && (
          <link rel="preconnect" href={R2_PUBLIC_ORIGIN} />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
