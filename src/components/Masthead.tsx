import Link from "next/link";
// import { BuyLink } from "./BuyLink";
import { IssueNav } from "./IssueNav";
import type { IssueSummary } from "@/domain/types";

// No stacking context here — a zoomed spread must paint over the chrome.
export function Masthead({ issues }: { issues: IssueSummary[] }) {
  return (
    <header className="relative mb-[clamp(1rem,2vw,1.5rem)] grid grid-cols-[1fr_auto_1fr] items-center gap-4 mobile:gap-2 [&>:last-child]:justify-self-end">
      <Link href="/" aria-label="krējums." className="group justify-self-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.webp"
          alt="krējums."
          width={282}
          height={273}
          className="block h-auto w-[clamp(64px,7vw,90px)] -rotate-3 transition-transform duration-500 ease-[cubic-bezier(0.3,1.3,0.4,1)] group-hover:rotate-2 group-hover:scale-105 motion-reduce:transition-none"
        />
      </Link>
      <BuyLink />
      <IssueNav issues={issues} />
    </header>
  );
}
