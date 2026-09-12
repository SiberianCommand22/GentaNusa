import styles from "./skeleton.module.css";

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={`${styles.block} ${styles.image}`} />
      <div className={styles.body}>
        <div className={`${styles.block} ${styles.badge}`} />
        <div className={`${styles.block} ${styles.title}`} />
        <div className={`${styles.block} ${styles.line}`} />
        <div className={`${styles.block} ${styles.lineShort}`} />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={`${styles.block} ${styles.heroImage}`} />
        <div className={`${styles.block} ${styles.heroTitle}`} />
        <div className={`${styles.block} ${styles.heroLine}`} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}