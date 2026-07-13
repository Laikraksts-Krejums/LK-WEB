import type { Metadata } from "next";
import { IssueCard } from "@/components/IssueCard";
import { Masthead } from "@/components/Masthead";
import { Tagline } from "@/components/Tagline";
import { getAllIssues } from "@/lib/issues";
import styles from "@/components/IssueCard.module.css";

// Must be a literal: Next reads route segment config statically, so an
// imported constant here fails the build. Mirrors REVALIDATE_SECONDS.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "numuri — krējums.",
  description: "Visi krējuma numuri.",
  alternates: { canonical: "/numuri" },
};

export default async function ArchivePage() {
  const issues = await getAllIssues();

  return (
    <>
      <Masthead />
      <main>
        <Tagline>visi numuri</Tagline>

        {issues.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              fontStyle: "italic",
              color: "var(--ink-soft)",
              padding: "4rem 1rem",
            }}
          >
            vēl nav neviena numura.
          </p>
        ) : (
          <ul className={styles.grid}>
            {issues.map((issue) => (
              <IssueCard key={issue.slug} issue={issue} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
