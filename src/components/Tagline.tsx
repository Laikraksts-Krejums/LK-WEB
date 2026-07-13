import styles from "./Tagline.module.css";

export function Tagline({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.tagline}>
      <p className={styles.text}>{children}</p>
    </div>
  );
}
