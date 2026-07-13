import type { Metadata } from "next";
import "./globals.css";
import styles from "./layout.module.css";
import { getSiteSettings } from "@/lib/issues";
import { SITE_DEFAULTS, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_DEFAULTS.title,
  description: SITE_DEFAULTS.tagline,
  keywords: [...SITE_DEFAULTS.keywords],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_DEFAULTS.title,
    description: SITE_DEFAULTS.tagline,
    locale: "lv_LV",
    url: SITE_URL,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULTS.title,
    description: SITE_DEFAULTS.tagline,
    images: ["/og-image.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Periodical",
    name: "krējums",
    alternateName: "Laikraksts Krējums",
    inLanguage: "lv",
    url: SITE_URL,
    description: settings.metaDescription ?? settings.tagline,
    publisher: {
      "@type": "Organization",
      name: "krējums",
      sameAs: [settings.instagramUrl, settings.facebookUrl].filter(Boolean),
    },
  };

  return (
    <html lang="lv">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className={styles.shell}>{children}</div>
      </body>
    </html>
  );
}
