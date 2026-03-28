"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStockDeepDive } from "@/lib/api/hooks";
import { NSE_SYMBOLS, COMPANY_NAMES, SECTOR_MAP } from "@/lib/utils/trading";
import { formatTicker, formatPrice, formatPct } from "@/lib/utils/format";
import { useSwissTheme } from "@/lib/utils/ThemeContext";
import TradingChart from "@/components/shared/TradingChart";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";

const HV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";

const INDICATOR_OPTIONS = [
  { id: "sma20", label: "SMA 20" },
  { id: "sma50", label: "SMA 50" },
  { id: "ema9", label: "EMA 9" },
  { id: "ema21", label: "EMA 21" },
  { id: "bollinger", label: "Bollinger" },
  { id: "vwap", label: "VWAP" },
];

const INDICATOR_PANELS = [
  { id: "rsi", label: "RSI" },
  { id: "macd", label: "MACD" },
  { id: "stochastic", label: "Stochastic" },
  { id: "adx", label: "ADX" },
];

export default function SwissChartPage() {
  const router = useRouter();
  const c = useSwissTheme();
  const isDark = c.isDark;
  
  const [selectedTicker, setSelectedTicker] = useState("RELIANCE.NS");
  const [timeframe, setTimeframe] = useState<Timeframe>("3M");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [activeIndicators, setActiveIndicators] = useState<string[]>(["sma20", "sma50"]);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);
  const [showStochastic, setShowStochastic] = useState(false);
  const [showADX, setShowADX] = useState(false);
  
  const lookback = timeframe === "1D" ? 1 : timeframe === "1W" ? 7 : timeframe === "1M" ? 30 : timeframe === "3M" ? 90 : timeframe === "6M" ? 180 : 365;
  const { data: dive, loading } = useStockDeepDive(selectedTicker, lookback);
  
  const toggleIndicator = (id: string) => {
    setActiveIndicators(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const filteredSymbols = NSE_SYMBOLS.filter(sym => {
    const clean = sym.replace(".NS", "").toLowerCase();
    const name = (COMPANY_NAMES[sym] ?? "").toLowerCase();
    return clean.includes(searchQuery.toLowerCase()) || name.includes(searchQuery.toLowerCase());
  }).slice(0, 10);
  
  const chartHeight = 500 + (showRSI ? 100 : 0) + (showMACD ? 100 : 0) + (showStochastic ? 100 : 0) + (showADX ? 100 : 0);
  
  return (
    <div className="min-h-screen" style={{ background: c.bgPrimary }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${c.borderSecondary}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
          {/* Ticker selector */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: c.bgSecondary,
                border: `1px solid ${c.borderSecondary}`,
                cursor: "pointer",
                fontFamily: HV,
              }}
            >
              <span style={{ fontSize: "24px", fontWeight: 900, color: c.accentRed }}>
                {formatTicker(selectedTicker)}
              </span>
              <span style={{ fontSize: "12px", color: c.textSecondary }}>
                {COMPANY_NAMES[selectedTicker]}
              </span>
              <ChevronDown size={14} color={c.textSecondary} />
            </button>
            
            {searchOpen && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "400px",
                background: c.bgCard,
                border: `1px solid ${c.borderSecondary}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                zIndex: 1000,
                marginTop: "4px",
              }}>
                <div style={{ padding: "8px", borderBottom: `1px solid ${c.borderSecondary}` }}>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: c.textMuted }} />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search symbol..."
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "8px 8px 8px 36px",
                        border: "none",
                        outline: "none",
                        fontFamily: HV,
                        fontSize: "13px",
                        background: "transparent",
                        color: c.textPrimary,
                      }}
                    />
                  </div>
                </div>
                {filteredSymbols.map(sym => (
                  <button
                    key={sym}
                    onClick={() => {
                      setSelectedTicker(sym);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "10px 16px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      borderBottom: `1px solid ${c.borderSubtle}`,
                      fontFamily: HV,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: c.textPrimary }}>{sym.replace(".NS", "")}</span>
                    <span style={{ fontSize: "12px", color: c.textSecondary }}>{COMPANY_NAMES[sym]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Price display */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <span style={{ fontSize: "32px", fontWeight: 900, color: c.textPrimary }}>
              ₹{formatPrice(dive?.current_price)}
            </span>
            {dive && (
              <span style={{ fontSize: "14px", fontWeight: 600, color: c.textSecondary }}>
                {SECTOR_MAP[selectedTicker]}
              </span>
            )}
          </div>
          
          {/* Timeframe selector */}
          <div style={{ display: "flex", gap: "4px" }}>
            {(["1D", "1W", "1M", "3M", "6M", "1Y"] as Timeframe[]).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "6px 12px",
                  fontFamily: HV,
                  fontSize: "11px",
                  fontWeight: timeframe === tf ? 700 : 400,
                  background: timeframe === tf ? c.textPrimary : "transparent",
                  color: timeframe === tf ? c.bgPrimary : c.textSecondary,
                  border: `1px solid ${timeframe === tf ? c.textPrimary : c.borderSecondary}`,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Indicators toolbar */}
      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${c.borderSecondary}`, display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
        {/* Overlay indicators */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, color: c.textMuted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Overlays
          </span>
          {INDICATOR_OPTIONS.map(ind => (
            <button
              key={ind.id}
              onClick={() => toggleIndicator(ind.id)}
              style={{
                padding: "4px 10px",
                fontFamily: HV,
                fontSize: "10px",
                fontWeight: activeIndicators.includes(ind.id) ? 700 : 400,
                background: activeIndicators.includes(ind.id) ? c.accentRed : "transparent",
                color: activeIndicators.includes(ind.id) ? "#fff" : c.textSecondary,
                border: `1px solid ${activeIndicators.includes(ind.id) ? c.accentRed : c.borderSecondary}`,
                cursor: "pointer",
              }}
            >
              {ind.label}
            </button>
          ))}
        </div>
        
        <div style={{ width: "1px", height: "20px", background: c.borderSecondary }} />
        
        {/* Indicator panels */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, color: c.textMuted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Panels
          </span>
          {INDICATOR_PANELS.map(ind => {
            const isActive = ind.id === "rsi" ? showRSI : ind.id === "macd" ? showMACD : ind.id === "stochastic" ? showStochastic : showADX;
            const setActive = ind.id === "rsi" ? setShowRSI : ind.id === "macd" ? setShowMACD : ind.id === "stochastic" ? setShowStochastic : setShowADX;
            return (
              <button
                key={ind.id}
                onClick={() => setActive(!isActive)}
                style={{
                  padding: "4px 10px",
                  fontFamily: HV,
                  fontSize: "10px",
                  fontWeight: isActive ? 700 : 400,
                  background: isActive ? c.accentRed : "transparent",
                  color: isActive ? "#fff" : c.textSecondary,
                  border: `1px solid ${isActive ? c.accentRed : c.borderSecondary}`,
                  cursor: "pointer",
                }}
              >
                {ind.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Chart */}
      <div style={{ padding: "16px 24px" }}>
        {loading ? (
          <div style={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: HV, fontSize: "14px", color: c.textMuted }}>Loading chart...</span>
          </div>
        ) : dive?.chart ? (
          <TradingChart
            data={dive.chart}
            isDark={isDark}
            indicators={activeIndicators}
            showVolume
            showRSI={showRSI}
            showMACD={showMACD}
            showStochastic={showStochastic}
            showADX={showADX}
            height={chartHeight}
          />
        ) : (
          <div style={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: HV, fontSize: "14px", color: c.textMuted }}>No chart data available</span>
          </div>
        )}
      </div>
      
      {/* Quick links */}
      <div style={{ padding: "16px 24px", borderTop: `1px solid ${c.borderSecondary}` }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link href={`/swiss/stocks/${selectedTicker}`} style={{ fontFamily: HV, fontSize: "11px", color: c.accentRed, textDecoration: "none" }}>
            View Full Analysis →
          </Link>
          <Link href="/swiss/predict" style={{ fontFamily: HV, fontSize: "11px", color: c.textSecondary, textDecoration: "none" }}>
            AI Predictions →
          </Link>
          <Link href="/swiss/recommendations" style={{ fontFamily: HV, fontSize: "11px", color: c.textSecondary, textDecoration: "none" }}>
            All Signals →
          </Link>
        </div>
      </div>
    </div>
  );
}
