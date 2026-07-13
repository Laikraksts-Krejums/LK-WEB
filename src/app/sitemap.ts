import type { MetadataRoute } from "next";
import { getAllIssues } from "@/lib/issues";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const issues = await getAllIssues();

  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/numuri`, changeFrequency: "monthly", priority: 0.8 },
    ...issues.map((issue) => ({
      url: `${SITE_URL}/numuri/${issue.slug}`,
      lastModified: issue.publishedAt ? new Date(issue.publishedAt) : undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
