import styles from "../layout.module.css";
import { getSiteSettings } from "@/lib/issues";
import { SITE_URL } from "@/lib/site";

export default async function SiteLayout({
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
    description: settings.tagline,
    publisher: {
      "@type": "Organization",
      name: "krējums",
      sameAs: [settings.instagramUrl, settings.facebookUrl].filter(Boolean),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.shell}>{children}</div>
    </>
  );
}
