"use client";

import { createContext, useContext, ReactNode } from "react";

// ─── EDITORIAL COLORS ──────────────────────────────────────────────────────

export function getEditorialColors(isDark: boolean) {
  return {
    isDark,
    textPrimary: isDark ? "#f0ede8" : "#1a1a18",
    textSecondary: isDark ? "#9a9793" : "#6b6b68",
    textMuted: isDark ? "#6a6764" : "#bbbbbb",
    bgPrimary: isDark ? "#12100e" : "#faf9f6",
    bgSecondary: isDark ? "#1c1916" : "#f5f4f1",
    bgCard: isDark ? "#1e1b18" : "#ffffff",
    bgInput: isDark ? "#1e1b18" : "#ffffff",
    bgHover: isDark ? "rgba(240,237,232,0.05)" : "rgba(114,47,55,0.05)",
    borderPrimary: isDark ? "rgba(240,237,232,0.15)" : "#000000",
    borderSecondary: isDark ? "rgba(240,237,232,0.1)" : "#e8e8e4",
    borderSubtle: isDark ? "rgba(240,237,232,0.06)" : "rgba(0,0,0,0.06)",
    accentPrimary: isDark ? "#c46b74" : "#722f37",
    accentGold: "#d4af37",
    accentBull: isDark ? "#2a8a57" : "#004225",
    accentBear: isDark ? "#c46b74" : "#722f37",
    accentNeutral: isDark ? "#9a9793" : "#6b6b68",
    shimmerStart: isDark ? "#1e1b18" : "#f0ede8",
    shimmerMid: isDark ? "#28251f" : "#e8e5e0",
    chartGrid: isDark ? "rgba(240,237,232,0.06)" : "rgba(0,0,0,0.06)",
    tooltipBg: isDark ? "#1e1b18" : "#ffffff",
    tooltipBorder: "#d4af37",
    tooltipText: isDark ? "#f0ede8" : "#1a1a18",
  };
}

export type EditorialColors = ReturnType<typeof getEditorialColors>;

// ─── SWISS COLORS ───────────────────────────────────────────────────────────

export function getSwissColors(isDark: boolean) {
  return {
    isDark,
    textPrimary: isDark ? "#f5f5f5" : "#000000",
    textSecondary: isDark ? "#888888" : "#666666",
    textMuted: isDark ? "#555555" : "#bbbbbb",
    bgPrimary: isDark ? "#0a0a0a" : "#ffffff",
    bgSecondary: isDark ? "#111111" : "#f5f5f0",
    bgCard: isDark ? "#141414" : "#ffffff",
    bgInput: isDark ? "#141414" : "#ffffff",
    bgHover: isDark ? "rgba(255,255,255,0.04)" : "#f5f5f0",
    borderPrimary: isDark ? "rgba(255,255,255,0.15)" : "#000000",
    borderSecondary: isDark ? "#222222" : "#cccccc",
    borderSubtle: isDark ? "#1a1a1a" : "#f0f0f0",
    accentRed: isDark ? "#e84040" : "#da291c",
    accentCyan: isDark ? "#00bdf0" : "#00a9e0",
    accentBull: isDark ? "#00bdf0" : "#00a9e0",
    accentBear: isDark ? "#e84040" : "#da291c",
    accentNeutral: isDark ? "#888888" : "#666666",
    shimmerStart: isDark ? "#141414" : "#f5f5f0",
    shimmerMid: isDark ? "#1e1e1e" : "#e8e8e4",
    chartGrid: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    tooltipBg: isDark ? "#141414" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.15)" : "#000000",
    tooltipText: isDark ? "#f5f5f5" : "#000000",
  };
}

export type SwissColors = ReturnType<typeof getSwissColors>;

// ─── CONTEXTS ───────────────────────────────────────────────────────────────

const EditorialThemeContext = createContext<EditorialColors>(
  getEditorialColors(false)
);

const SwissThemeContext = createContext<SwissColors>(getSwissColors(false));

export function EditorialThemeProvider({
  isDark,
  children,
}: {
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <EditorialThemeContext.Provider value={getEditorialColors(isDark)}>
      {children}
    </EditorialThemeContext.Provider>
  );
}

export function SwissThemeProvider({
  isDark,
  children,
}: {
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <SwissThemeContext.Provider value={getSwissColors(isDark)}>
      {children}
    </SwissThemeContext.Provider>
  );
}

export function useEditorialTheme(): EditorialColors {
  return useContext(EditorialThemeContext);
}

export function useSwissTheme(): SwissColors {
  return useContext(SwissThemeContext);
}
