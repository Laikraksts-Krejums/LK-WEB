import { clsx } from "clsx";

// The mono, lowercase, wide-tracked label used as an issue-number/section
// eyebrow. Colour and exact size come from the caller.
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "font-mono text-[0.7rem] font-bold lowercase tracking-[0.12em]",
        className,
      )}
    >
      {children}
    </span>
  );
}
