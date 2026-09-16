"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./reveal.module.css";

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`${styles.reveal} ${visible ? styles.visible : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default Reveal;
