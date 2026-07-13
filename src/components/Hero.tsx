import styles from "./Hero.module.css";

type HeroProps = {
  src?: string;
  alt?: string;
};

/**
 * Renders nothing without a hero image — that is how the poster gets taken
 * down: an editor clears the field, and the page closes up with no gap.
 */
export function Hero({ src, alt = "krējums. nenoliec karoti." }: HeroProps) {
  if (!src) return null;

  return (
    <section className={styles.hero}>
      <a
        href="#reader"
        className={styles.poster}
        aria-label="nenoliec karoti — atvērt laikrakstu"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
      </a>
    </section>
  );
}
