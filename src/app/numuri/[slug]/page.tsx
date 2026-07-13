import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Masthead } from "@/components/Masthead";
import { Reader } from "@/components/reader/Reader";
import { Tagline } from "@/components/Tagline";
import { getIssueBySlug } from "@/lib/issues";
import { client } from "@/sanity/client";
import { ISSUE_SLUGS_QUERY } from "@/sanity/queries";

// Must be a literal: Next reads route segment config statically, so an
// imported constant here fails the build. Mirrors REVALIDATE_SECONDS.
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

  return {
    title: `${issue.title} — krējums.`,
    description: issue.blurb,
    alternates: { canonical: `/numuri/${issue.slug}` },
    openGraph: {
      title: `${issue.title} — krējums.`,
      description: issue.blurb,
      images: issue.coverUrl ? [issue.coverUrl] : undefined,
    },
  };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  if (!issue) notFound();

  return (
    <>
      <Masthead />
      <Tagline>{issue.blurb ?? issue.title}</Tagline>
      <Reader pages={issue.pages} hotspots={issue.hotspots} />
    </>
  );
}
