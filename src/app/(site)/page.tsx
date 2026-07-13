import Link from "next/link";
import { Cta } from "@/components/Cta";
import { Hero } from "@/components/Hero";
import { Masthead } from "@/components/Masthead";
import { Reader } from "@/components/reader/Reader";
import { Tagline } from "@/components/Tagline";
import { getLatestIssue, getSiteSettings } from "@/lib/issues";

export const revalidate = 300;

export default async function Home() {
  const [issue, settings] = await Promise.all([
    getLatestIssue(),
    getSiteSettings(),
  ]);

  return (
    <>
      <Masthead />

      <main>
        {issue ? (
          <>
            <Hero
              src={issue.heroUrl}
              width={issue.heroWidth}
              height={issue.heroHeight}
            />
            <Tagline>{settings.tagline}</Tagline>
            <Cta />
            <Reader pages={issue.pages} hotspots={issue.hotspots} />
          </>
        ) : (
          <>
            <Tagline>{settings.tagline}</Tagline>
            <p
              style={{
                textAlign: "center",
                fontStyle: "italic",
                color: "var(--ink-soft)",
                padding: "4rem 1rem",
              }}
            >
              drīzumā. — <Link href="/admin">redakcija</Link>
            </p>
          </>
        )}
      </main>
    </>
  );
}
