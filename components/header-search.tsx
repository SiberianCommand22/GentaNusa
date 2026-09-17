"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./header-search.module.css";

interface SearchArticle {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  tags: string[];
}

interface HeaderSearchProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function HeaderSearch({ isOpen, onToggle, onClose }: HeaderSearchProps) {
  const [articles, setArticles] = useState<SearchArticle[]>([]);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setArticles(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || !focused) return [];
    const q = query.trim().toLowerCase();
    return articles
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, articles, focused]);

  if (loading) {
    return <div className={styles.headerSearch} />;
  }

  return (
    <div className={styles.headerSearch}>
      <input
        type="search"
        className={styles.searchInput}
        placeholder="Cari berita..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        aria-label="Cari berita"
      />
      {results.length > 0 && (
        <div className={styles.searchDropdown}>
          {results.map((a) => (
            <Link
              key={a.id}
              href={`/artikel/${a.id}`}
              className={styles.searchResult}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className={styles.searchResultTitle}>{a.title}</div>
              <div className={styles.searchResultMeta}>
                <span className={styles.searchCategory}>{a.category}</span>
                <span>{a.date}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {query.trim() && focused && results.length === 0 && (
        <div className={styles.searchDropdown}>
          <div className={styles.searchEmpty}>Tidak ada hasil</div>
        </div>
      )}
    </div>
  );
}