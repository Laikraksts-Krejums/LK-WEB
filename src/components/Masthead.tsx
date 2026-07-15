import Link from "next/link";
import { IssueNav } from "./IssueNav";
import type { IssueSummary } from "@/domain/types";

// Brand chrome: static files, not CMS content. z-20 for the same reason the
// reader controls carry one — a zoomed spread is transformed and would
// otherwise paint over an open issue menu.
export function Masthead({ issues }: { issues: IssueSummary[] }) {
  return (
    <header className="relative z-20 mb-[clamp(1rem,2vw,1.5rem)] flex items-center justify-between gap-4 mobile:gap-2">
      <Link href="/" aria-label="krējums." className="group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.webp"
          alt="krējums."
          width={282}
          height={273}
          className="block h-auto w-[clamp(64px,7vw,90px)] -rotate-3 transition-transform duration-500 ease-[cubic-bezier(0.3,1.3,0.4,1)] group-hover:rotate-2 group-hover:scale-105 motion-reduce:transition-none"
        />
      </Link>
      <IssueNav issues={issues} />
    </header>
  );
}
