import styles from "./Cta.module.css";

export function Cta({
  href = "#reader",
  children = "lasīt laikrakstu",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <a href={href} className={styles.cta}>
        {children} <span className={styles.arrow}>↓</span>
      </a>
    </div>
  );
}
