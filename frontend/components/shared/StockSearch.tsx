"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { NSE_SYMBOLS, COMPANY_NAMES, SECTOR_MAP } from "@/lib/utils/trading";

interface StockSearchProps {
  basePath?: string;
  theme?: "editorial" | "swiss";
  placeholder?: string;
}

export default function StockSearch({
  basePath = "/swiss",
  theme = "swiss",
  placeholder = "Search stocks…",
}: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const lower = q.toLowerCase().replace(".ns", "");
    const matches = NSE_SYMBOLS.filter((sym) => {
      const clean = sym.replace(".NS", "").toLowerCase();
      const name = (COMPANY_NAMES[sym] ?? "").toLowerCase();
      return clean.includes(lower) || name.includes(lower);
    }).slice(0, 8);
    setResults(matches);
    setIdx(0);
  }, []);

  useEffect(() => {
    search(query);
  }, [query, search]);

  const go = (sym: string) => {
    router.push(`${basePath}/stocks/${sym}`);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown")
      setIdx((i) => Math.min(i + 1, results.length - 1));
    if (e.key === "ArrowUp") setIdx((i) => Math.max(i - 1, 0));
    if (e.key === "Enter" && results[idx]) go(results[idx]);
    if (e.key === "Escape") {
      setQuery("");
      setResults([]);
      setOpen(false);
    }
  };

  const isEditorial = theme === "editorial";

  const inputStyle: React.CSSProperties = isEditorial
    ? {
        fontFamily: '"Georgia", serif',
        fontSize: "14px",
        color: "#1a1a18",
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.12)",
        padding: "8px 36px 8px 36px",
        width: "280px",
        outline: "none",
        boxShadow: open ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
      }
    : {
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: "12px",
        color: "#000000",
        background: "#ffffff",
        border: "1px solid #cccccc",
        borderTop: "2px solid #000000",
        padding: "7px 32px 7px 32px",
        width: "260px",
        outline: "none",
        letterSpacing: "0.05em",
      };

  const dropdownStyle: React.CSSProperties = isEditorial
    ? {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        zIndex: 1000,
        maxHeight: "320px",
        overflowY: "auto",
      }
    : {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        background: "#ffffff",
        border: "1px solid #000000",
        zIndex: 1000,
        maxHeight: "320px",
        overflowY: "auto",
      };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{ position: "relative" }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: isEditorial ? "#bbb" : "#666",
            pointerEvents: "none",
          }}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={12} color={isEditorial ? "#bbb" : "#999"} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={dropdownStyle}>
          {results.map((sym, i) => (
            <button
              key={sym}
              onClick={() => go(sym)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: isEditorial ? "10px 16px" : "8px 12px",
                background:
                  i === idx
                    ? isEditorial
                      ? "rgba(114,47,55,0.06)"
                      : "#f5f5f0"
                    : "transparent",
                border: "none",
                cursor: "pointer",
                borderBottom:
                  i < results.length - 1
                    ? isEditorial
                      ? "1px solid rgba(0,0,0,0.04)"
                      : "1px solid #f0f0f0"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: isEditorial
                        ? '"Playfair Display", serif'
                        : '"Helvetica Neue", sans-serif',
                      fontSize: isEditorial ? "15px" : "13px",
                      fontWeight: 700,
                      color: isEditorial ? "#722f37" : "#000000",
                      letterSpacing: isEditorial ? "-0.01em" : "0",
                    }}
                  >
                    {sym.replace(".NS", "")}
                  </div>
                  <div
                    style={{
                      fontFamily: isEditorial
                        ? '"Georgia", serif'
                        : '"Helvetica Neue", sans-serif',
                      fontSize: "11px",
                      color: "#999",
                      marginTop: "1px",
                    }}
                  >
                    {COMPANY_NAMES[sym] ?? sym}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: isEditorial
                      ? '"Georgia", serif'
                      : '"Helvetica Neue", sans-serif',
                    fontSize: "10px",
                    color: isEditorial ? "#d4af37" : "#666",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {SECTOR_MAP[sym] ?? "NSE"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
