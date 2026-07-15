"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconMenu } from "@/components/ui/icons";
import type { IssueSummary } from "@/domain/types";

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
    <div className="relative" ref={navRef}>
      <IconButton
        ref={triggerRef}
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="issue-menu"
        aria-label="numuri"
      >
        <IconMenu />
      </IconButton>

      {open && (
        // No shadow — a crisp ink hairline lifts the panel (Krējums: no shadows).
        <div
          id="issue-menu"
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] max-h-[min(60vh,420px)] min-w-[240px] max-w-[min(320px,calc(100vw-2rem))] animate-panel overflow-y-auto rounded-xl border border-ink bg-cream p-[0.4rem] font-mono motion-reduce:animate-none"
        >
          <ul className="m-0 list-none p-0">
            {issues.map((issue) => {
              const isCurrent = issue.slug === current;
              return (
                <li key={issue.slug}>
                  <Link
                    href={`/numuri/${issue.slug}`}
                    role="menuitem"
                    aria-current={isCurrent ? "page" : undefined}
                    className="flex items-baseline gap-[0.6rem] rounded-lg px-[0.7rem] py-[0.6rem] text-ink no-underline transition-[background] duration-[140ms] hover:bg-cream-deep motion-reduce:transition-none"
                  >
                    <Eyebrow className="flex-none text-orange">
                      nr. {issue.number}
                    </Eyebrow>
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-serif text-[0.95rem]">
                      {issue.title}
                    </span>
                    {isCurrent && (
                      <span
                        aria-hidden
                        className="size-[6px] flex-none rounded-full bg-orange"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href="/numuri"
            role="menuitem"
            className="mt-[0.4rem] block border-t border-rule px-[0.7rem] py-[0.6rem] font-mono text-[0.7rem] font-bold lowercase tracking-[0.12em] text-ink-soft no-underline transition-colors duration-[140ms] hover:text-ink motion-reduce:transition-none"
          >
            visi numuri
          </Link>
        </div>
      )}
    </div>
  );
}
