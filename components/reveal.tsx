"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./reveal.module.css";

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (delay === 0) return;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`${styles.reveal} ${visible ? styles.visible : ""}`}>
      {children}
    </div>
  );
}

export default Reveal;