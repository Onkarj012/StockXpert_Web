"use client";

import { useAllHorizons } from "@/lib/api/hooks";
import { formatTicker, formatPct } from "@/lib/utils/format";
import { horizonToDate, formatTradingDate } from "@/lib/utils/trading";
import { useEditorialTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

type SideFilter = "both" | "long" | "short";

export default function EditorialHorizons() {
  const [side, setSide] = useState<SideFilter>("both");
  const horizons = useAllHorizons(side, 10);
  const c = useEditorialTheme();

  const compareData = horizons.map((h) => {
    const cards = h.data?.cards ?? [];
    const longCards = cards.filter((c) => c.direction === "long");
    const shortCards = cards.filter((c) => c.direction === "short");
    const avgConf =
      cards.length > 0
        ? cards.reduce((a, c) => a + c.confidence_pct, 0) / cards.length
        : 0;
    const avgReturn =
      cards.length > 0
        ? cards.reduce((a, c) => a + Math.abs(c.expected_return_pct ?? 0), 0) /
          cards.length
        : 0;

    return {
      horizon: `${h.horizon}D`,
      horizonNum: h.horizon,
      date: formatTradingDate(horizonToDate(h.horizon)),
      long: longCards.length,
      short: shortCards.length,
      avgConf: parseFloat(avgConf.toFixed(1)),
      avgReturn: parseFloat(avgReturn.toFixed(2)),
      loading: h.loading,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            fontFamily: '"Georgia", serif',
            fontSize: "11px",
            color: c.accentGold,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Forecast Horizons
        </div>
        <h1
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "52px",
            fontWeight: 900,
            color: c.textPrimary,
            letterSpacing: "-0.03em",
            lineHeight: 0.9,
            marginBottom: "16px",
          }}
        >
          Multi-Horizon Analysis
        </h1>
        <p
          style={{
            fontFamily: '"Georgia", serif',
            fontSize: "16px",
            color: c.textSecondary,
            maxWidth: "540px",
            lineHeight: 1.55,
          }}
        >
          Compare signal counts, confidence, and expected returns across all
          five forecast horizons — from tomorrow's session to 10 trading days ahead.
        </p>
      </div>

      {/* Direction Filter */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
        {(["both", "long", "short"] as SideFilter[]).map((s) => {
          const sc =
            s === "long" ? c.accentBull : s === "short" ? c.accentBear : c.textPrimary;
          return (
            <button
              key={s}
              onClick={() => setSide(s)}
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "13px",
                padding: "6px 16px",
                background: side === s ? sc : "transparent",
                border: `1px solid ${side === s ? sc : c.borderSecondary}`,
                color: side === s ? "#fff" : sc,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {s === "both" ? "All signals" : s}
            </button>
          );
        })}
      </div>

      {/* Aggregate Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          marginBottom: "48px",
        }}
      >
        {/* Signal count by horizon */}
        <div style={{ borderTop: `3px solid ${c.accentBear}`, paddingTop: "16px" }}>
          <div
            style={{
              fontFamily: '"Georgia", serif',
              fontSize: "10px",
              color: c.textMuted,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Signal count by horizon
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={compareData} barGap={2}>
              <CartesianGrid strokeDasharray="2 2" stroke={c.chartGrid} vertical={false} />
              <XAxis
                dataKey="horizon"
                tick={{ fontSize: 11, fontFamily: '"Georgia", serif', fill: c.textSecondary }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fontFamily: '"Georgia", serif', fill: c.textMuted }}
                axisLine={false}
                tickLine={false}
                width={25}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "12px",
                  border: `1px solid ${c.accentGold}`,
                  background: c.tooltipBg,
                  color: c.tooltipText,
                }}
              />
              <Legend
                iconType="square"
                wrapperStyle={{ fontFamily: '"Georgia", serif', fontSize: "11px", color: c.textSecondary }}
              />
              <Bar dataKey="long" name="Long" fill={c.accentBull} maxBarSize={28} radius={[1, 1, 0, 0]} />
              <Bar dataKey="short" name="Short" fill={c.accentBear} maxBarSize={28} radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Avg confidence + return by horizon */}
        <div style={{ borderTop: `3px solid ${c.accentGold}`, paddingTop: "16px" }}>
          <div
            style={{
              fontFamily: '"Georgia", serif',
              fontSize: "10px",
              color: c.textMuted,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Avg confidence & expected return
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={compareData} barGap={2}>
              <CartesianGrid strokeDasharray="2 2" stroke={c.chartGrid} vertical={false} />
              <XAxis
                dataKey="horizon"
                tick={{ fontSize: 11, fontFamily: '"Georgia", serif', fill: c.textSecondary }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fontFamily: '"Georgia", serif', fill: c.textMuted }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "12px",
                  border: `1px solid ${c.accentGold}`,
                  background: c.tooltipBg,
                  color: c.tooltipText,
                }}
                formatter={(v, name) => [
                  `${(v as number).toFixed(1)}%`,
                  name === "avgConf" ? "Avg Confidence" : "Avg Return",
                ]}
              />
              <Bar dataKey="avgConf" name="avgConf" fill={c.accentNeutral} maxBarSize={28} radius={[1, 1, 0, 0]} />
              <Bar dataKey="avgReturn" name="avgReturn" fill={c.accentGold} maxBarSize={28} radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Horizon-by-horizon deep dive */}
      <div style={{ height: "1px", background: c.accentGold, marginBottom: "40px" }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "24px",
          marginBottom: "48px",
        }}
      >
        {horizons.map((h) => {
          const cards = h.data?.cards ?? [];
          const longCards = cards.filter((c) => c.direction === "long");
          const shortCards = cards.filter((c) => c.direction === "short");
          const tDate = horizonToDate(h.horizon);
          return (
            <div
              key={h.horizon}
              style={{ borderTop: `3px solid ${c.accentBear}`, paddingTop: "16px" }}
            >
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "36px",
                  fontWeight: 900,
                  color: c.textPrimary,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {h.horizon}D
              </div>
              <div
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "11px",
                  color: c.textMuted,
                  marginTop: "4px",
                }}
              >
                {formatTradingDate(tDate)}
              </div>

              {h.loading ? (
                <div
                  style={{
                    marginTop: "16px",
                    height: "80px",
                    background: `linear-gradient(90deg, ${c.shimmerStart} 0%, ${c.shimmerMid} 50%, ${c.shimmerStart} 100%)`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    borderRadius: "2px",
                  }}
                />
              ) : (
                <>
                  <div
                    style={{
                      marginTop: "16px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <div style={{ borderTop: `2px solid ${c.accentBull}`, paddingTop: "8px" }}>
                      <div
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: "24px",
                          fontWeight: 900,
                          color: c.accentBull,
                        }}
                      >
                        {longCards.length}
                      </div>
                      <div
                        style={{
                          fontFamily: '"Georgia", serif',
                          fontSize: "9px",
                          color: c.textMuted,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                        }}
                      >
                        Long
                      </div>
                    </div>
                    <div style={{ borderTop: `2px solid ${c.accentBear}`, paddingTop: "8px" }}>
                      <div
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: "24px",
                          fontWeight: 900,
                          color: c.accentBear,
                        }}
                      >
                        {shortCards.length}
                      </div>
                      <div
                        style={{
                          fontFamily: '"Georgia", serif',
                          fontSize: "9px",
                          color: c.textMuted,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                        }}
                      >
                        Short
                      </div>
                    </div>
                  </div>

                  {/* Top 3 picks */}
                  <div
                    style={{
                      marginTop: "12px",
                      borderTop: `1px solid ${c.borderSubtle}`,
                      paddingTop: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "9px",
                        color: c.textMuted,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      Top picks
                    </div>
                    {cards.slice(0, 3).map((card) => (
                      <div
                        key={card.ticker}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <Link
                          href={`/editorial/stocks/${card.ticker}`}
                          style={{
                            textDecoration: "none",
                            fontFamily: '"Playfair Display", serif',
                            fontSize: "12px",
                            fontWeight: 700,
                            color: card.direction === "long" ? c.accentBull : c.accentBear,
                          }}
                        >
                          {formatTicker(card.ticker)}
                        </Link>
                        <span
                          style={{
                            fontFamily: '"Georgia", serif',
                            fontSize: "10px",
                            color: c.textMuted,
                          }}
                        >
                          {card.confidence_pct.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/editorial/recommendations?horizon=${h.horizon}`}
                    style={{
                      display: "inline-block",
                      marginTop: "12px",
                      fontFamily: '"Georgia", serif',
                      fontSize: "11px",
                      color: c.accentBear,
                      textDecoration: "none",
                      borderBottom: `1px solid ${c.accentGold}`,
                      paddingBottom: "1px",
                    }}
                  >
                    All {cards.length} signals →
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
