"use client";

import { useState, useEffect, createContext, useContext } from "react";

export type ColorMode = "light" | "dark";

const THEME_KEY = "stockxpert_theme";

export function useColorMode(): [ColorMode, () => void] {
  const [mode, setMode] = useState<ColorMode>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as ColorMode | null;
      if (saved === "dark" || saved === "light") setMode(saved);
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches)
        setMode("dark");
    } catch {}
  }, []);

  const toggle = () => {
    setMode((prev) => {
      const next: ColorMode = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
      return next;
    });
  };

  return [mode, toggle];
}
