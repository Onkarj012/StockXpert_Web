"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRecommendations } from "@/lib/api/hooks";
import { formatTicker, formatPrice, formatPct } from "@/lib/utils/format";
import {
  horizonToDate,
  formatTradingDate,
} from "@/lib/utils/trading";
import { useWatchlist } from "@/lib/utils/watchlist";
import { useEditorialTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import {
  BookmarkPlus,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

const HORIZONS = [1, 3, 5, 7, 10] as const;
type SortKey = "confidence" | "return" | "rr" | "price";

function SkeletonRow() {
  const c = useEditorialTheme();
  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: `1px solid ${c.borderSubtle}`,
        display: "flex",
        gap: "20px",
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            flex: i === 2 ? 2 : 1,
            height: "40px",
            background: `linear-gradient(90deg, ${c.shimmerStart} 0%, ${c.shimmerMid} 50%, ${c.shimmerStart} 100%)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            borderRadius: "2px",
          }}
        />
      ))}
    </div>
  );
}

function WatchlistCell({ ticker }: { ticker: string }) {
  const { toggle, has } = useWatchlist();
  const c = useEditorialTheme();
  return (
    <button
      onClick={() => toggle(ticker)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
      }}
      title="Watchlist"
    >
      {has(ticker) ? (
        <BookmarkCheck size={14} color={c.accentGold} />
      ) : (
        <BookmarkPlus size={14} color={c.textMuted} />
      )}
    </button>
  );
}

function EditorialRecommendationsInner() {
  const searchParams = useSearchParams();
  const [horizon, setHorizon] = useState<number>(
    Number(searchParams.get("horizon") ?? 1),
  );
  const [side, setSide] = useState<"long" | "short" | "both">("both");
  const [topN, setTopN] = useState(20);
  const [sortKey, setSortKey] = useState<SortKey>("confidence");
  const [sortAsc, setSortAsc] = useState(false);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const c = useEditorialTheme();

  const { data, loading } = useRecommendations({ horizon, side, top_n: topN });

  const targetDate = horizonToDate(horizon);

  let cards = data?.cards ?? [];

  if (symbolFilter) {
    cards = cards.filter(
      (c) =>
        c.ticker.toLowerCase().includes(symbolFilter.toLowerCase()) ||
        c.company_name.toLowerCase().includes(symbolFilter.toLowerCase()),
    );
  }

  if (sectorFilter) {
    cards = cards.filter((c) =>
      (c.sector ?? "").toLowerCase().includes(sectorFilter.toLowerCase()),
    );
  }

  cards = [...cards].sort((a, b) => {
    let av: number, bv: number;
    if (sortKey === "confidence") {
      av = a.confidence_pct;
      bv = b.confidence_pct;
    } else if (sortKey === "return") {
      av = Math.abs(a.expected_return_pct ?? 0);
      bv = Math.abs(b.expected_return_pct ?? 0);
    } else if (sortKey === "rr") {
      av = a.risk_reward_ratio ?? 0;
      bv = b.risk_reward_ratio ?? 0;
    } else {
      av = a.current_price ?? 0;
      bv = b.current_price ?? 0;
    }
    return sortAsc ? av - bv : bv - av;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const confBuckets = [
    {
      range: "50–60%",
      count: cards.filter(
        (c) => c.confidence_pct >= 50 && c.confidence_pct < 60,
      ).length,
    },
    {
      range: "60–70%",
      count: cards.filter(
        (c) => c.confidence_pct >= 60 && c.confidence_pct < 70,
      ).length,
    },
    {
      range: "70–80%",
      count: cards.filter(
        (c) => c.confidence_pct >= 70 && c.confidence_pct < 80,
      ).length,
    },
    {
      range: "80–90%",
      count: cards.filter(
        (c) => c.confidence_pct >= 80 && c.confidence_pct < 90,
      ).length,
    },
    {
      range: "90%+",
      count: cards.filter((c) => c.confidence_pct >= 90).length,
    },
  ];

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? (
        <ChevronUp size={11} />
      ) : (
        <ChevronDown size={11} />
      )
    ) : null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div
        className="px-8 pt-12 pb-8"
        style={{ borderBottom: `1px solid ${c.borderSubtle}` }}
      >
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
          AI Signal Intelligence
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "56px",
              fontWeight: 900,
              color: c.textPrimary,
              letterSpacing: "-0.03em",
              lineHeight: 0.9,
            }}
          >
            Recommendations
          </h1>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: '"Georgia", serif',
                fontSize: "13px",
                color: c.accentBear,
                marginBottom: "4px",
              }}
            >
              <Clock size={13} />
              Target: {formatTradingDate(targetDate)}
            </div>
            <div
              style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: "italic",
                fontSize: "20px",
                color: c.textPrimary,
              }}
            >
              {cards.length} signals
            </div>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div
        className="px-8 py-4"
        style={{
          borderBottom: `1px solid ${c.borderSubtle}`,
          background: c.bgSecondary,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          {/* Horizon */}
          <div>
            <div
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "10px",
                color: c.textMuted,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Horizon
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "13px",
                    fontWeight: horizon === h ? 700 : 400,
                    padding: "5px 10px",
                    background: horizon === h ? c.accentBear : "transparent",
                    border: `1px solid ${horizon === h ? c.accentBear : c.borderSecondary}`,
                    color: horizon === h ? "#ffffff" : c.textSecondary,
                    cursor: "pointer",
                  }}
                >
                  {h}D
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div>
            <div
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "10px",
                color: c.textMuted,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Direction
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["both", "long", "short"] as const).map((s) => {
                const sc =
                  s === "long"
                    ? c.accentBull
                    : s === "short"
                      ? c.accentBear
                      : c.textPrimary;
                return (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    style={{
                      fontFamily: '"Georgia", serif',
                      fontSize: "12px",
                      padding: "5px 12px",
                      background: side === s ? sc : "transparent",
                      border: `1px solid ${side === s ? sc : c.borderSecondary}`,
                      color: side === s ? "#ffffff" : sc,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {s === "both" ? "All" : s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top N */}
          <div>
            <div
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "10px",
                color: c.textMuted,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Show
            </div>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "13px",
                color: c.textPrimary,
                background: c.bgInput,
                border: `1px solid ${c.borderSecondary}`,
                padding: "5px 8px",
                cursor: "pointer",
              }}
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  Top {n}
                </option>
              ))}
            </select>
          </div>

          {/* Symbol filter */}
          <div>
            <div
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "10px",
                color: c.textMuted,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Filter
            </div>
            <input
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              placeholder="ticker or company…"
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "13px",
                color: c.textPrimary,
                background: c.bgInput,
                border: `1px solid ${c.borderSecondary}`,
                padding: "5px 10px",
                width: "180px",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Columns + Chart */}
      <div
        className="px-8 pt-6"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 240px",
          gap: "40px",
          alignItems: "start",
        }}
      >
        {/* Table */}
        <div>
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "2.5rem 1fr 1.6fr 5rem 5rem 5.5rem 5.5rem 5rem 3rem",
              gap: "12px",
              padding: "6px 0",
              borderTop: `2px solid ${c.textPrimary}`,
              borderBottom: `2px solid ${c.textPrimary}`,
              marginBottom: "0",
            }}
          >
            {[
              { l: "#", k: null, align: "left" },
              { l: "Ticker", k: null, align: "left" },
              { l: "Company", k: null, align: "left" },
              { l: "Entry", k: null, align: "right" },
              { l: "Target", k: null, align: "right" },
              { l: "Return", k: "return" as SortKey, align: "right" },
              { l: "Confidence", k: "confidence" as SortKey, align: "right" },
              { l: "R/R", k: "rr" as SortKey, align: "right" },
              { l: "", k: null, align: "center" },
            ].map(({ l, k, align }) => (
              <div
                key={l}
                onClick={() => k && handleSort(k)}
                style={{
                  fontFamily: '"Helvetica Neue", sans-serif',
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: sortKey === k ? c.accentBear : c.textSecondary,
                  textAlign: align as "left" | "right" | "center",
                  cursor: k ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: align === "right" ? "flex-end" : "flex-start",
                  gap: "3px",
                }}
              >
                {l} {k && <SortIcon col={k} />}
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading
            ? Array(8)
                .fill(0)
                .map((_, i) => <SkeletonRow key={i} />)
            : cards.map((card, i) => {
                const isBullCard = card.direction === "long";
                const accentColor = isBullCard
                  ? c.accentBull
                  : card.direction === "short"
                    ? c.accentBear
                    : c.accentNeutral;

                return (
                  <div
                    key={`${card.ticker}-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "2.5rem 1fr 1.6fr 5rem 5rem 5.5rem 5.5rem 5rem 3rem",
                      gap: "12px",
                      padding: "12px 0",
                      borderBottom: `1px solid ${c.borderSubtle}`,
                      alignItems: "center",
                    }}
                  >
                    {/* Rank */}
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "12px",
                        fontStyle: "italic",
                        color: c.textMuted,
                      }}
                    >
                      {i + 1}
                    </div>

                    {/* Ticker */}
                    <div>
                      <Link
                        href={`/editorial/stocks/${card.ticker}`}
                        style={{ textDecoration: "none" }}
                      >
                        <div
                          style={{
                            fontFamily: '"Playfair Display", serif',
                            fontSize: "16px",
                            fontWeight: 900,
                            color: accentColor,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {formatTicker(card.ticker)}
                        </div>
                      </Link>
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          marginTop: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: '"Georgia", serif',
                            fontSize: "9px",
                            color: "#fff",
                            background: accentColor,
                            padding: "1px 5px",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {card.direction.toUpperCase()}
                        </span>
                        {card.sector && (
                          <span
                            style={{
                              fontFamily: '"Georgia", serif',
                              fontSize: "9px",
                              color: c.textMuted,
                              border: `1px solid ${c.borderSecondary}`,
                              padding: "1px 5px",
                            }}
                          >
                            {card.sector}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Company */}
                    <div
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "12px",
                        color: c.textSecondary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {card.company_name}
                    </div>

                    {/* Entry */}
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "13px",
                        fontWeight: 700,
                        color: c.textPrimary,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      ₹{formatPrice(card.entry_price)}
                    </div>

                    {/* Target */}
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "13px",
                        fontWeight: 700,
                        color: c.accentBull,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      ₹{formatPrice(card.target_price)}
                    </div>

                    {/* Return */}
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "14px",
                        fontWeight: 900,
                        color: isBullCard ? c.accentBull : c.accentBear,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatPct(card.expected_return_pct)}
                    </div>

                    {/* Confidence */}
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: "15px",
                          fontWeight: 900,
                          color: accentColor,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {card.confidence_pct.toFixed(1)}%
                      </div>
                      <div
                        style={{
                          height: "2px",
                          background: c.bgSecondary,
                          marginTop: "3px",
                        }}
                      >
                        <div
                          style={{
                            width: `${card.confidence_pct}%`,
                            height: "100%",
                            background: `linear-gradient(to right, ${accentColor}80, ${accentColor})`,
                          }}
                        />
                      </div>
                    </div>

                    {/* R/R */}
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "13px",
                        fontWeight: 700,
                        color:
                          (card.risk_reward_ratio ?? 0) >= 2
                            ? c.accentGold
                            : c.textPrimary,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {card.risk_reward_ratio?.toFixed(2)}×
                    </div>

                    {/* Watchlist */}
                    <WatchlistCell ticker={card.ticker} />
                  </div>
                );
              })}
        </div>

        {/* Sidebar: Confidence Distribution + Stats */}
        <div style={{ position: "sticky", top: "100px" }}>
          <div
            style={{
              borderTop: `3px solid ${c.accentBear}`,
              paddingTop: "16px",
              marginBottom: "24px",
            }}
          >
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
              Confidence distribution
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={confBuckets} barSize={30}>
                <XAxis
                  dataKey="range"
                  tick={{
                    fontSize: 9,
                    fontFamily: '"Georgia", serif',
                    fill: c.textMuted,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    fontFamily: '"Georgia", serif',
                    fontSize: "11px",
                    border: `1px solid ${c.accentGold}`,
                    background: c.tooltipBg,
                    color: c.tooltipText,
                  }}
                />
                <Bar dataKey="count" name="Signals" radius={[2, 2, 0, 0]}>
                  {confBuckets.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        idx < 2
                          ? c.borderSecondary
                          : idx === 2
                            ? c.textMuted
                            : idx === 3
                              ? c.accentBull
                              : c.accentBear
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div
            style={{
              borderTop: `1px solid ${c.borderSubtle}`,
              paddingTop: "16px",
            }}
          >
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
              Signal summary
            </div>
            {[
              {
                label: "Long",
                count: cards.filter((c) => c.direction === "long").length,
                color: c.accentBull,
              },
              {
                label: "Short",
                count: cards.filter((c) => c.direction === "short").length,
                color: c.accentBear,
              },
              {
                label: "High conf (>75%)",
                count: cards.filter((c) => c.confidence_pct > 75).length,
                color: c.accentGold,
              },
              {
                label: "Avg R/R ratio",
                count: 0,
                value:
                  (
                    cards.reduce(
                      (acc, c) => acc + (c.risk_reward_ratio ?? 0),
                      0,
                    ) / (cards.length || 1)
                  ).toFixed(2) + "×",
                color: c.accentNeutral,
              },
            ].map(({ label, count, color, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                  borderBottom: `1px solid ${c.borderSubtle}`,
                }}
              >
                <div
                  style={{
                    fontFamily: '"Georgia", serif',
                    fontSize: "12px",
                    color: c.textSecondary,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "16px",
                    fontWeight: 900,
                    color,
                  }}
                >
                  {value ?? count}
                </div>
              </div>
            ))}
          </div>

          {/* Horizon navigation */}
          <div
            style={{
              borderTop: `1px solid ${c.borderSubtle}`,
              paddingTop: "16px",
            }}
          >
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
              Other horizons
            </div>
            {HORIZONS.filter((h) => h !== horizon).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  paddingBottom: "8px",
                  marginBottom: "8px",
                  borderBottom: `1px solid ${c.borderSubtle}`,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "14px",
                    fontWeight: 700,
                    color: c.textPrimary,
                  }}
                >
                  {h}D
                </div>
                <div
                  style={{
                    fontFamily: '"Georgia", serif',
                    fontSize: "11px",
                    color: c.textMuted,
                  }}
                >
                  {formatTradingDate(horizonToDate(h))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorialRecommendations() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-8 py-16" style={{ fontFamily: '"Georgia", serif', fontStyle: 'italic' }}>Loading signals…</div>}>
      <EditorialRecommendationsInner />
    </Suspense>
  );
}
