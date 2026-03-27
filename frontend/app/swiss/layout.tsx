"use client";

import SwissNav from "./components/SwissNav";
import { useColorMode } from "@/lib/utils/theme";
import { SwissThemeProvider } from "@/lib/utils/ThemeContext";

export default function SwissLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, toggleMode] = useColorMode();
  const isDark = mode === "dark";

  return (
    <SwissThemeProvider isDark={isDark}>
      <div
        className={`theme-swiss min-h-screen${isDark ? " dark" : ""}`}
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
      >
        <SwissNav isDark={isDark} toggleMode={toggleMode} />
        <main className="pt-16 max-w-7xl mx-auto px-8">{children}</main>
      </div>
    </SwissThemeProvider>
  );
}
