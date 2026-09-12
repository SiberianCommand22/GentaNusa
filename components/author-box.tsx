import styles from "./author-box.module.css";

interface AuthorBoxProps {
  name: string;
  role?: string;
  bio?: string;
}

export function AuthorBox({ name, role = "Redaktur GentaNusa", bio }: AuthorBoxProps) {
  return (
    <div className={styles.authorBox}>
      <div className={styles.avatar}>{name.charAt(0)}</div>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        {role && <span className={styles.role}>{role}</span>}
        {bio && <p className={styles.bio}>{bio}</p>}
      </div>
    </div>
  );
}