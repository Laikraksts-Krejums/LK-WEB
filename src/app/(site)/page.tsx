import Link from "next/link";
import { Reader } from "@/components/reader/Reader";
import { getLatestIssue } from "@/lib/issues";

export const revalidate = 300;

export default async function Home() {
  const issue = await getLatestIssue();

  return (
    <main>
      {issue ? (
        <Reader pages={issue.pages} hotspots={issue.hotspots} />
      ) : (
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
      )}
    </main>
  );
}
