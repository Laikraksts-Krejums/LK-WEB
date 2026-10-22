"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconUnderline } from "@/components/ui/icons";

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  // navigator.clipboard is undefined on plain http (e.g. testing on a phone over LAN).
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  el.remove();
}

export function CopyCodeword({ codeword }: { codeword: string }) {
  const [copies, setCopies] = useState(0);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await writeClipboard(codeword);
    } catch {
      return;
    }
    setCopies((n) => n + 1);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`kopēt kodvārdu „${codeword}”`}
      className="group mt-1 inline-flex cursor-pointer flex-col items-center bg-transparent [-webkit-tap-highlight-color:transparent]"
    >
      <span
        className={clsx(
          "block font-serif text-[clamp(1.6rem,4.5vw,2.2rem)] italic transition-colors duration-[140ms] group-hover:text-orange motion-reduce:transition-none",
          copied ? "text-orange" : "text-ink",
        )}
      >
        „{codeword}”
      </span>
      <IconUnderline
        key={`line-${copies}`}
        className={clsx(
          "-mt-1 h-[7px] w-full text-orange [stroke-dasharray:1] transition-opacity duration-300 motion-reduce:animate-none",
          copied ? "animate-draw" : "opacity-0",
        )}
      />
      <span aria-live="polite" className="mt-1 block">
        <Eyebrow
          className={clsx(
            "block transition-colors duration-[140ms] motion-reduce:transition-none",
            copied ? "text-orange" : "text-ink-soft",
          )}
        >
          {copied ? "nokopēts!" : "piespied, lai nokopētu"}
        </Eyebrow>
      </span>
    </button>
  );
}
