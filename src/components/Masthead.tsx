import Link from "next/link";
import { IssueNav } from "./IssueNav";
import type { IssueSummary } from "@/lib/issues";
import styles from "./Masthead.module.css";

/** Brand chrome: static files, not CMS content. */
export function Masthead({ issues }: { issues: IssueSummary[] }) {
  return (
    <header className={styles.masthead}>
      <Link href="/" aria-label="krējums." className={styles.logoLink}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.webp"
          alt="krējums."
          className={styles.logo}
          width={282}
          height={273}
        />
      </Link>
      <IssueNav issues={issues} />
    </header>
  );
}
