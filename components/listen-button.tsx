"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./listen-button.module.css";

export function ListenButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      const id = setTimeout(() => setSupported(false), 0);
      return () => clearTimeout(id);
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "id-ID";
    utter.rate = 1;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utterRef.current = utter;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  return (
    <button className={styles.button} onClick={toggle} aria-pressed={speaking}>
      {speaking ? "⏸ Hentikan" : "🔊 Dengarkan"}
    </button>
  );
}