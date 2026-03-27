"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import StockSearch from "@/components/shared/StockSearch";
import { Sun, Moon } from "lucide-react";

const navItems = [
  { href: "/editorial", label: "Market Overview" },
  { href: "/editorial/recommendations", label: "Signals" },
  { href: "/editorial/horizons", label: "Horizons" },
  { href: "/editorial/predict", label: "Predict" },
  { href: "/editorial/watchlist", label: "Watchlist" },
  { href: "/editorial/status", label: "System" },
];

interface EditorialNavProps {
  isDark: boolean;
  toggleMode: () => void;
}

export default function EditorialNav({
  isDark,
  toggleMode,
}: EditorialNavProps) {
  const path = usePathname();

  const bg = isDark ? "rgba(18,16,14,0.97)" : "rgba(250,249,246,0.97)";
  const border = isDark ? "rgba(240,237,232,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#f0ede8" : "#1a1a18";
  const textSecondary = isDark ? "#9a9793" : "#6b6b68";
  const accentColor = isDark ? "#c46b74" : "#722f37";
  const goldColor = "#d4af37";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: bg,
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          height: "2px",
          background: `linear-gradient(to right, transparent, ${goldColor} 20%, ${accentColor} 50%, ${goldColor} 80%, transparent)`,
        }}
      />
      <div className="max-w-7xl mx-auto px-8 h-[72px] flex items-center gap-6">
        {/* Logo */}
        <Link href="/editorial" className="shrink-0">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: accentColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 900,
                  fontSize: "13px",
                  color: isDark ? "#12100e" : "#faf9f6",
                }}
              >
                SX
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 900,
                  fontSize: "17px",
                  color: textPrimary,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                StockXpert
              </div>
              <div
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "9px",
                  color: goldColor,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                }}
              >
                Editorial
              </div>
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0 flex-1 min-w-0 overflow-x-auto">
          {navItems.map(({ href, label }) => {
            const isActive =
              path === href || (href !== "/editorial" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "13px",
                  color: isActive ? accentColor : textSecondary,
                  borderBottom: isActive
                    ? `2px solid ${goldColor}`
                    : "2px solid transparent",
                  paddingBottom: "2px",
                  padding: "0 10px 2px 10px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <StockSearch
          basePath="/editorial"
          theme="editorial"
        />

        {/* Dark mode toggle */}
        <button
          onClick={toggleMode}
          style={{
            background: "none",
            border: `1px solid ${isDark ? "rgba(240,237,232,0.15)" : "rgba(0,0,0,0.1)"}`,
            padding: "5px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: textSecondary,
          }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun size={13} color={goldColor} />
          ) : (
            <Moon size={13} color={accentColor} />
          )}
        </button>

        {/* Switch to Swiss */}
        <Link
          href="/swiss"
          style={{
            fontFamily: '"Georgia", serif',
            fontSize: "11px",
            color: textSecondary,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          → Swiss
        </Link>
      </div>
    </header>
  );
}
