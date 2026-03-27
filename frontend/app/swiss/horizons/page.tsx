"use client";

import { useAllHorizons } from "@/lib/api/hooks";
import { formatTicker } from "@/lib/utils/format";
import { horizonToDate, formatTradingDate } from "@/lib/utils/trading";
import { useSwissTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, Legend,
} from "recharts";

const HV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function SwissHorizons() {
  const [side, setSide] = useState<"both" | "long" | "short">("both");
  const horizons = useAllHorizons(side, 10);
  const c = useSwissTheme();

  const compareData = horizons.map((h) => {
    const cards = h.data?.cards ?? [];
    return {
      h: `${h.horizon}D`,
      long: cards.filter((card) => card.direction === "long").length,
      short: cards.filter((card) => card.direction === "short").length,
      avgConf: cards.length > 0 ? cards.reduce((a, card) => a + card.confidence_pct, 0) / cards.length : 0,
      avgRet: cards.length > 0 ? cards.reduce((a, card) => a + Math.abs(card.expected_return_pct ?? 0), 0) / cards.length : 0,
      loading: h.loading,
    };
  });

  return (
    <div className="py-12">
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: c.textSecondary, marginBottom: "8px" }}>
          Forecast Analysis
        </div>
        <h1 style={{ fontFamily: HV, fontSize: "52px", fontWeight: 900, color: c.textPrimary, letterSpacing: "-0.04em", lineHeight: 0.9 }}>
          Multi-Horizon
        </h1>
      </div>

      <div style={{ height: "2px", background: c.textPrimary, marginBottom: "24px" }} />

      {/* Filter */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "32px" }}>
        {(["both", "long", "short"] as const).map((s) => {
          const sc = s === "long" ? c.accentCyan : s === "short" ? c.accentRed : c.textPrimary;
          return (
            <button key={s} onClick={() => setSide(s)} style={{ fontFamily: HV, fontSize: "10px", fontWeight: side === s ? 700 : 400, padding: "4px 10px", background: side === s ? sc : "transparent", border: `1px solid ${side === s ? sc : c.borderSecondary}`, color: side === s ? "#fff" : sc, cursor: "pointer", textTransform: "capitalize", letterSpacing: "0.05em" }}>
              {s === "both" ? "All" : s}
            </button>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "48px" }}>
        <div style={{ borderTop: `2px solid ${c.textPrimary}`, paddingTop: "12px" }}>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "12px" }}>
            Signal count by horizon
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={compareData} barGap={1}>
              <CartesianGrid strokeDasharray="2 2" stroke={c.chartGrid} vertical={false} />
              <XAxis dataKey="h" tick={{ fontSize: 10, fontFamily: HV, fill: c.textSecondary }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fontFamily: HV, fill: c.textMuted }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={{ fontFamily: HV, fontSize: "10px", border: `1px solid ${c.textPrimary}`, background: c.tooltipBg, color: c.tooltipText }} />
              <Legend iconType="square" wrapperStyle={{ fontFamily: HV, fontSize: "10px", color: c.textSecondary }} />
              <Bar dataKey="long" name="Long" fill={c.accentCyan} maxBarSize={24} radius={[1, 1, 0, 0]} />
              <Bar dataKey="short" name="Short" fill={c.accentRed} maxBarSize={24} radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ borderTop: `2px solid ${c.accentRed}`, paddingTop: "12px" }}>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "12px" }}>
            Avg confidence &amp; expected return
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={compareData} barGap={1}>
              <CartesianGrid strokeDasharray="2 2" stroke={c.chartGrid} vertical={false} />
              <XAxis dataKey="h" tick={{ fontSize: 10, fontFamily: HV, fill: c.textSecondary }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fontFamily: HV, fill: c.textMuted }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontFamily: HV, fontSize: "10px", border: `1px solid ${c.textPrimary}`, background: c.tooltipBg, color: c.tooltipText }} formatter={(v, n) => [`${(v as number).toFixed(1)}%`, n === "avgConf" ? "Avg Conf" : "Avg Return"]} />
              <Bar dataKey="avgConf" name="avgConf" fill={c.textSecondary} maxBarSize={24} radius={[1, 1, 0, 0]} />
              <Bar dataKey="avgRet" name="avgRet" fill={c.textPrimary} maxBarSize={24} radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ height: "1px", background: c.textPrimary, marginBottom: "32px" }} />

      {/* Horizon cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "20px" }}>
        {horizons.map((h) => {
          const cards = h.data?.cards ?? [];
          const longCards = cards.filter((card) => card.direction === "long");
          const shortCards = cards.filter((card) => card.direction === "short");
          return (
            <div key={h.horizon} style={{ borderTop: `2px solid ${c.textPrimary}`, paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <div style={{ fontFamily: HV, fontSize: "32px", fontWeight: 900, color: c.textPrimary, letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {h.horizon}D
                </div>
                <div style={{ fontFamily: HV, fontSize: "10px", color: c.textMuted }}>
                  {formatTradingDate(horizonToDate(h.horizon))}
                </div>
              </div>

              {h.loading ? (
                <div style={{ height: "80px", background: `linear-gradient(90deg, ${c.shimmerStart} 0%, ${c.shimmerMid} 50%, ${c.shimmerStart} 100%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                    <div style={{ borderTop: `2px solid ${c.accentCyan}`, paddingTop: "6px" }}>
                      <div style={{ fontFamily: HV, fontSize: "22px", fontWeight: 900, color: c.accentCyan }}>{longCards.length}</div>
                      <div style={{ fontFamily: HV, fontSize: "9px", color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Long</div>
                    </div>
                    <div style={{ borderTop: `2px solid ${c.accentRed}`, paddingTop: "6px" }}>
                      <div style={{ fontFamily: HV, fontSize: "22px", fontWeight: 900, color: c.accentRed }}>{shortCards.length}</div>
                      <div style={{ fontFamily: HV, fontSize: "9px", color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Short</div>
                    </div>
                  </div>

                  <div style={{ height: "1px", background: c.borderSubtle, marginBottom: "8px" }} />
                  {cards.slice(0, 3).map((card) => (
                    <div key={card.ticker} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "5px", marginBottom: "5px", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                      <Link href={`/swiss/stocks/${card.ticker}`} style={{ textDecoration: "none", fontWeight: 700, fontSize: "11px", color: card.direction === "long" ? c.accentCyan : c.accentRed }}>
                        {formatTicker(card.ticker)}
                      </Link>
                      <span style={{ fontSize: "10px", color: c.textMuted, fontVariantNumeric: "tabular-nums" }}>
                        {card.confidence_pct.toFixed(0)}%
                      </span>
                    </div>
                  ))}

                  <Link href={`/swiss/recommendations?horizon=${h.horizon}`} style={{ display: "inline-block", marginTop: "8px", fontFamily: HV, fontSize: "10px", color: c.accentRed, textDecoration: "underline", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    All {cards.length} →
                  </Link>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
