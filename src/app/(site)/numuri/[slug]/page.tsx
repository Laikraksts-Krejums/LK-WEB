import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reader } from "@/components/reader/Reader";
import { getIssueBySlug } from "@/server/issues";
import { client } from "@/sanity/client";
import { ISSUE_SLUGS_QUERY } from "@/sanity/queries";

// Must be a literal — Next reads segment config statically. Mirrors REVALIDATE_SECONDS.
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs: string[] = await client.fetch(ISSUE_SLUGS_QUERY).catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  if (!issue) return {};

  const ogImage = `/og?issue=${encodeURIComponent(issue.slug)}`;

  return {
    title: `${issue.title} — krējums.`,
    description: issue.blurb,
    alternates: { canonical: `/numuri/${issue.slug}` },
    openGraph: {
      title: `${issue.title} — krējums.`,
      description: issue.blurb,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${issue.title} — krējums.`,
      description: issue.blurb,
      images: [ogImage],
    },
  };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  if (!issue) notFound();

  return (
    <main>
      <Reader pages={issue.pages} hotspots={issue.hotspots} />
    </main>
  );
}
