import styles from "../layout.module.css";
import { Masthead } from "@/components/Masthead";
import { getAllIssues, getSiteLinkUrls, getSiteSettings } from "@/server/issues";
import { SITE_URL } from "@/lib/site";

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
      // Only http(s) links (a saved link can be a mailto: address, which
      // is not a valid sameAs target).
      sameAs: linkUrls.filter((url) => url.startsWith("http")),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.shell}>
        <Masthead issues={issues} />
        {children}
      </div>
    </>
  );
}
