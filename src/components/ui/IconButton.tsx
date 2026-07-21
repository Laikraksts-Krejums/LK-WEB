import { clsx } from "clsx";

export function IconButton({
  className,
  type = "button",
  ...props
}: React.ComponentPropsWithRef<"button">) {
  return (
    <button
      type={type}
      className={clsx(
        "flex cursor-pointer appearance-none items-center justify-center bg-transparent p-2 text-ink transition-colors",
        "[&_svg]:size-[22px] mobile:[&_svg]:size-5",
        "enabled:hover:animate-wob enabled:hover:text-orange",
        "disabled:cursor-not-allowed disabled:opacity-35",
        className,
      )}
      {...props}
    />
  );
}
