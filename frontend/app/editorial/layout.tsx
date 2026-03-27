"use client";

import EditorialNav from "./components/EditorialNav";
import { useColorMode } from "@/lib/utils/theme";
import { EditorialThemeProvider } from "@/lib/utils/ThemeContext";

export default function EditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, toggleMode] = useColorMode();
  const isDark = mode === "dark";

  return (
    <EditorialThemeProvider isDark={isDark}>
      <div
        className={`theme-editorial min-h-screen${isDark ? " dark paper-texture" : " paper-texture"}`}
        style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
      >
        <EditorialNav isDark={isDark} toggleMode={toggleMode} />
        <main className="pt-[72px]">{children}</main>
      </div>
    </EditorialThemeProvider>
  );
}
