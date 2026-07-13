import styles from "./Hero.module.css";

type HeroProps = {
  src?: string;
  width?: number;
  height?: number;
  alt?: string;
};

/**
 * Renders nothing without a hero image — that is how the poster gets taken
 * down: an editor clears the field, and the page closes up with no gap.
 *
 * This is the LCP element. width/height are what keep it from shoving the
 * tagline, CTA and reader down the page when it decodes.
 */
export function Hero({
  src,
  width,
  height,
  alt = "krējums. nenoliec karoti.",
}: HeroProps) {
  if (!src) return null;

  return (
    <section className={styles.hero}>
      {/* React hoists this into <head>, so the poster starts downloading off the
          preload scanner instead of waiting for the CSS and layout. */}
      <link rel="preload" as="image" href={src} fetchPriority="high" />
      <a
        href="#reader"
        className={styles.poster}
        aria-label="nenoliec karoti — atvērt laikrakstu"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          fetchPriority="high"
          decoding="async"
        />
      </a>
    </section>
  );
}
