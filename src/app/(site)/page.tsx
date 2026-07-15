import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reader } from "@/components/reader/Reader";
import { getLatestIssue } from "@/server/issues";

export const revalidate = 300;

export default async function Home() {
  const issue = await getLatestIssue();

  return (
    <main>
      {issue ? (
        <Reader pages={issue.pages} hotspots={issue.hotspots} />
      ) : (
        <EmptyState>
          drīzumā. — <Link href="/admin">redakcija</Link>
        </EmptyState>
      )}
    </main>
  );
}
