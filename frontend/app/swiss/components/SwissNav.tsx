"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import StockSearch from "@/components/shared/StockSearch";
import { Sun, Moon } from "lucide-react";

const navItems = [
  { href: "/swiss", label: "Dashboard" },
  { href: "/swiss/recommendations", label: "Signals" },
  { href: "/swiss/horizons", label: "Horizons" },
  { href: "/swiss/predict", label: "Predict" },
  { href: "/swiss/watchlist", label: "Watchlist" },
  { href: "/swiss/status", label: "Status" },
];

const HV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface SwissNavProps {
  isDark?: boolean;
  toggleMode?: () => void;
}

export default function SwissNav({
  isDark = false,
  toggleMode,
}: SwissNavProps) {
  const path = usePathname();

  const bg = isDark ? "#0a0a0a" : "#ffffff";
  const borderC = isDark ? "rgba(255,255,255,0.15)" : "#000000";
  const textPrimary = isDark ? "#f5f5f5" : "#000000";
  const textSecondary = isDark ? "#888888" : "#666666";
  const accentColor = isDark ? "#e84040" : "#da291c";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: bg, borderBottom: `2px solid ${borderC}` }}
    >
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link
          href="/swiss"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: HV,
              fontSize: "20px",
              fontWeight: 900,
              color: textPrimary,
              letterSpacing: "-0.03em",
            }}
          >
            STOCK<span style={{ color: accentColor }}>XPERT</span>
          </div>
          <div style={{ width: "1px", height: "18px", background: borderC }} />
          <div
            style={{
              fontFamily: HV,
              fontSize: "10px",
              color: textSecondary,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            Swiss
            <br />
            Design
          </div>
        </Link>

        {/* Nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {navItems.map(({ href, label }) => {
            const active =
              path === href || (href !== "/swiss" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: HV,
                  fontSize: "11px",
                  fontWeight: active ? 700 : 400,
                  color: active ? textPrimary : textSecondary,
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "0 10px 2px 10px",
                  borderBottom: active
                    ? `2px solid ${accentColor}`
                    : "2px solid transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <StockSearch basePath="/swiss" />

        {/* Dark mode toggle */}
        {toggleMode && (
          <button
            onClick={toggleMode}
            style={{
              background: "none",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "#cccccc"}`,
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: textSecondary,
              flexShrink: 0,
            }}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? (
              <Sun size={12} color="#e84040" />
            ) : (
              <Moon size={12} color="#da291c" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
