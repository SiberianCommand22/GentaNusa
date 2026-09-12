import Link from "next/link";
import styles from "./author-box.module.css";

interface AuthorBoxProps {
  name: string;
  slug?: string;
  role?: string;
  bio?: string;
}

export function AuthorBox({ name, slug = "redaksi-generic", role = "Redaktur GentaNusa", bio }: AuthorBoxProps) {
  const avatar = name.charAt(0).toUpperCase();
  const box = (
    <div className={styles.authorBox}>
      <div className={styles.avatar}>{avatar}</div>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        {role && <span className={styles.role}>{role}</span>}
        {bio && <p className={styles.bio}>{bio}</p>}
      </div>
    </div>
  );

  return <Link href={`/penulis/${slug}`} className={styles.link}>{box}</Link>;
}