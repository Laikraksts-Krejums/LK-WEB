import Link from "next/link";
import styles from "./Masthead.module.css";

/** Brand chrome: static files, not CMS content. */
export function Masthead() {
  return (
    <header className={styles.masthead}>
      <Link href="/" aria-label="krējums." className={styles.logoLink}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.webp"
          alt="krējums."
          className={styles.logo}
          width={282}
          height={273}
        />
      </Link>
      <a
        href="#reader"
        aria-label="nenoliec karoti — atvērt laikrakstu"
        className={styles.sloganLink}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/slogan.webp"
          alt="nenoliec karoti."
          className={styles.slogan}
          width={563}
          height={244}
        />
      </a>
    </header>
  );
}
