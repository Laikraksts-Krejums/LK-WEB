import Link from "next/link";
import styles from "./Masthead.module.css";

/** Brand chrome: static files, not CMS content. */
export function Masthead() {
  return (
    <header className={styles.masthead}>
      <Link href="/" aria-label="krējums." className={styles.logoLink}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="krējums."
          className={styles.logo}
          width={1200}
          height={1161}
        />
      </Link>
      <a
        href="#reader"
        aria-label="nenoliec karoti — atvērt laikrakstu"
        className={styles.sloganLink}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/slogan.png"
          alt="nenoliec karoti."
          className={styles.slogan}
          width={1000}
          height={260}
        />
      </a>
    </header>
  );
}
