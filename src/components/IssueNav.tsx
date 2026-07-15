"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { IssueSummary } from "@/domain/types";
import styles from "./IssueNav.module.css";

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor">
      <line x1="4" y1="7" x2="20" y2="7" strokeWidth={2} strokeLinecap="round" />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="17"
        x2="20"
        y2="17"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The issue list is ordered `number desc`, so issues[0] is the one the homepage
 * renders — that is what makes "/" resolvable to a current issue without the
 * server telling us which one it picked.
 */
function activeSlug(pathname: string, issues: IssueSummary[]): string | null {
  if (pathname === "/") return issues[0]?.slug ?? null;
  const match = /^\/numuri\/([^/]+)/.exec(pathname);
  return match ? match[1] : null;
}

export function IssueNav({ issues }: { issues: IssueSummary[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  const navRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Any navigation closes the panel, including back/forward — which fire no
  // click of ours, so the panel would otherwise survive the trip.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (issues.length === 0) return null;

  const current = activeSlug(pathname, issues);

  return (
    <div className={styles.nav} ref={navRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="issue-menu"
        aria-label="numuri"
      >
        <IconMenu />
      </button>

      {open && (
        <div className={styles.panel} id="issue-menu" role="menu">
          <ul className={styles.list}>
            {issues.map((issue) => {
              const isCurrent = issue.slug === current;
              return (
                <li key={issue.slug}>
                  <Link
                    href={`/numuri/${issue.slug}`}
                    className={styles.item}
                    role="menuitem"
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    <span className={styles.number}>nr. {issue.number}</span>
                    <span className={styles.title}>{issue.title}</span>
                    {isCurrent && <span className={styles.dot} aria-hidden />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link href="/numuri" className={styles.all} role="menuitem">
            visi numuri
          </Link>
        </div>
      )}
    </div>
  );
}
