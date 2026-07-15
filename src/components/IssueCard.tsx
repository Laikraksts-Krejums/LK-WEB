import Link from "next/link";
import type { IssueSummary } from "@/domain/types";
import styles from "./IssueCard.module.css";

/** Roman numerals for the issue number — the magazine numbers itself I, II, … */
function roman(n: number): string {
  const table: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let rest = n;
  let out = "";
  for (const [value, numeral] of table) {
    while (rest >= value) {
      out += numeral;
      rest -= value;
    }
  }
  return out || String(n);
}

export function IssueCard({ issue }: { issue: IssueSummary }) {
  const year = issue.publishedAt
    ? new Date(issue.publishedAt).getFullYear()
    : null;

  return (
    <li>
      <Link href={`/numuri/${issue.slug}`} className={styles.card}>
        <div className={styles.inner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.cover}
            src={issue.coverUrl ?? "/og-image.jpg"}
            alt={`${issue.title} — vāks`}
            loading="lazy"
          />
          <div className={styles.meta}>
            <div className={styles.number}>numurs {roman(issue.number)}</div>
            <p className={styles.title}>{issue.title}</p>
            {year && <p className={styles.date}>{year}</p>}
          </div>
        </div>
      </Link>
    </li>
  );
}
