"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconMenu, IconUnderline } from "@/components/ui/icons";
import { clsx } from "clsx";
import type { IssueSummary } from "@/domain/types";


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
        
        <div
          id="issue-menu"
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-30 max-h-[min(60vh,420px)] min-w-[240px] max-w-[min(320px,calc(100vw-2rem))] animate-panel overflow-y-auto rounded-xl border border-ink bg-cream-deep p-[0.4rem] font-mono motion-reduce:animate-none"
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
                    className="group relative flex items-baseline gap-[0.6rem] rounded-lg px-[0.7rem] py-[0.6rem] text-ink no-underline"
                  >
                    <Eyebrow className="flex-none text-orange">
                      {issue.edition ?? `nr. ${issue.number}`}
                    </Eyebrow>
 
                    <span className="flex min-w-0 flex-col items-start">
                      <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-serif text-[0.95rem]">
                        {issue.title}
                      </span>
                      <IconUnderline
                        className={clsx(
                          "pointer-events-none mt-[2px] h-[6px] w-full transition-opacity duration-[140ms] motion-reduce:transition-none",
                          isCurrent
                            ? "text-orange opacity-100"
                            : "text-ink opacity-0 group-hover:opacity-70",
                        )}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <IconUnderline
            className="mx-[0.7rem] mt-[0.4rem] block h-[6px] w-[calc(100%-1.4rem)] text-rule"
          />

          <Link
            href="/numuri"
            role="menuitem"
            className="block px-[0.7rem] py-[0.6rem] font-serif text-[0.95rem] text-ink-soft no-underline transition-colors duration-[140ms] hover:text-ink motion-reduce:transition-none"
          >
            visi numuri
          </Link>
        </div>
      )}
    </div>
  );
}
