import { clsx } from "clsx";

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
