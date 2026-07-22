import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { IssueCard } from "@/components/IssueCard";
import { getAllIssues } from "@/server/issues";

// Must be a literal — Next reads segment config statically. Mirrors REVALIDATE_SECONDS.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "numuri — krējums.",
  description: "Visi krējuma numuri.",
  alternates: { canonical: "/numuri" },
};

export default async function ArchivePage() {
  const issues = await getAllIssues();

  return (
    <main>
      <h1 className="mx-auto mt-[clamp(1rem,2vw,1.5rem)] text-center font-serif text-[clamp(0.85rem,1.4vw,0.98rem)] font-normal italic leading-normal text-ink-soft">
        visi numuri
      </h1>

      {issues.length === 0 ? (
        <EmptyState>vēl nav neviena numura.</EmptyState>
      ) : (
        <ul className="mt-[clamp(1.5rem,4vw,2.5rem)] mb-12 grid list-none grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-[clamp(1.5rem,4vw,2.5rem)] p-0">
          {issues.map((issue) => (
            <IssueCard key={issue.slug} issue={issue} />
          ))}
        </ul>
      )}
    </main>
  );
}
