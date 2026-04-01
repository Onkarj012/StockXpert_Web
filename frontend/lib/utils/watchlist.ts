"use client";

import { useState, useEffect } from "react";

const WATCHLIST_KEY = "stockxpert_watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      if (saved) setWatchlist(JSON.parse(saved));
    } catch {
      setWatchlist([]);
    }
  }, []);

  const add = (ticker: string) => {
    setWatchlist((prev) => {
      if (prev.includes(ticker)) return prev;
      const updated = [...prev, ticker];
      try {
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const remove = (ticker: string) => {
    setWatchlist((prev) => {
      const updated = prev.filter((t) => t !== ticker);
      try {
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggle = (ticker: string) => {
    if (watchlist.includes(ticker)) remove(ticker);
    else add(ticker);
  };

  const has = (ticker: string) => watchlist.includes(ticker);

  return { watchlist, add, remove, toggle, has };
}
