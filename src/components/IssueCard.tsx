import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { IssueSummary } from "@/domain/types";

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

const SPRING = "transition-transform duration-500 ease-[cubic-bezier(0.3,1.3,0.4,1)] motion-reduce:transition-none";

export function IssueCard({ issue }: { issue: IssueSummary }) {
  const year = issue.publishedAt
    ? new Date(issue.publishedAt).getFullYear()
    : null;

  return (
    <li>
      <Link
        href={`/numuri/${issue.slug}`}
        className={`block text-inherit no-underline -rotate-1 hover:rotate-0 hover:scale-[1.03] ${SPRING}`}
      >
        {/* Every other card leans the other way, for a scattered-on-a-table look. */}
        <div className={`[li:nth-child(even)_&]:rotate-[1.5deg] ${SPRING}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="block h-auto w-full aspect-[1/1.414] object-cover border border-rule bg-cream-deep"
            src={issue.coverUrl ?? "/og-image.jpg"}
            alt={`${issue.title} — vāks`}
            width={800}
            height={1131}
            loading="lazy"
            decoding="async"
          />
          <div className="mt-[0.9rem] text-center">
            <Eyebrow className="text-[0.75rem] tracking-[0.15em] text-orange">
              numurs {roman(issue.number)}
            </Eyebrow>
            <p className="mt-1 font-serif text-[1.05rem] text-ink">{issue.title}</p>
            {year && (
              <p className="mt-[0.2rem] font-mono text-[0.7rem] tracking-[0.05em] text-ink-soft">
                {year}
              </p>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
