"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function BuyLink() {
  const isCurrent = usePathname() === "/nopirkt";

  return (
    <Link
      href="/nopirkt"
      aria-current={isCurrent ? "page" : undefined}
      className={clsx(
        "block -rotate-2 rounded-full border border-orange px-[0.85rem] py-[0.4rem] text-center font-mono text-[0.8rem] font-bold lowercase leading-tight tracking-[0.04em] no-underline transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.3,1.3,0.4,1)] hover:rotate-0 in-fullscreen:hidden motion-reduce:transition-none mobile:px-[0.65rem] mobile:text-[0.72rem]",
        isCurrent ? "rotate-0 bg-orange text-cream" : "text-orange hover:bg-orange hover:text-cream",
      )}
    >
      gribu nopirkt krējumu
    </Link>
  );
}
