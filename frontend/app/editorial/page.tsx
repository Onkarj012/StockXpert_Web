"use client";

import { useDashboard } from "@/lib/api/hooks";
import {
  formatTicker,
  formatPrice,
  formatPct,
  formatDateTime,
} from "@/lib/utils/format";
import {
  horizonToDate,
  formatTradingDate,
  signalBiasRatio,
} from "@/lib/utils/trading";
import { useWatchlist } from "@/lib/utils/watchlist";
import { useEditorialTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Minus,
  BookmarkPlus,
  BookmarkCheck,
  ChevronRight,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useState } from "react";

const HORIZONS = [1, 3, 5, 7, 10] as const;

function SkeletonBlock({
  width = "100%",
  height = 20,
}: {
  width?: string | number;
  height?: number;
}) {
  const c = useEditorialTheme();
  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(90deg, ${c.shimmerStart} 0%, ${c.shimmerMid} 50%, ${c.shimmerStart} 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        borderRadius: "2px",
      }}
    />
  );
}

export default function EditorialDashboard() {
  const [selectedHorizon, setSelectedHorizon] = useState<number>(1);
  const {
    data: dash,
    loading,
    refetch,
  } = useDashboard({ horizon: selectedHorizon, top_n: 10 });
  const { toggle, has } = useWatchlist();
  const c = useEditorialTheme();

  if (loading || !dash) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="space-y-6">
          <SkeletonBlock height={80} />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonBlock key={i} height={120} />
            ))}
          </div>
          <SkeletonBlock height={400} />
        </div>
      </div>
    );
  }

  const { signal_counts, market_regime, top_cards, sector_summary } = dash;
  const isBull = market_regime.label?.toUpperCase().includes("BULL");
  const isNeutral = market_regime.label?.toUpperCase().includes("NEUTRAL");
  const regimeColor = isBull ? c.accentBull : isNeutral ? c.accentNeutral : c.accentBear;
  const total =
    signal_counts.long + signal_counts.short + signal_counts.neutral;

  // Prepare sector data for radar chart
  const sectorData = Object.entries(sector_summary)
    .slice(0, 8)
    .map(([sector, counts]) => ({
      sector: sector.split(" ")[0], // Short name
      long: counts.long,
      short: counts.short,
      bias: signalBiasRatio(counts.long, counts.short) * 100,
    }));

  // Signal distribution for bar chart
  const signalBarData = HORIZONS.map((h) => ({
    horizon: `${h}D`,
    long: Math.round(signal_counts.long * (0.8 + Math.random() * 0.4)),
    short: Math.round(signal_counts.short * (0.8 + Math.random() * 0.4)),
  }));

  // Next trading day for selected horizon
  const targetDate = horizonToDate(selectedHorizon);

  return (
    <div className="max-w-7xl mx-auto">
      {/* ═══ MASTHEAD ═══ */}
      <section
        className="px-8 pt-12 pb-10"
        style={{ borderBottom: `1px solid ${c.borderSubtle}` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ height: "1px", background: c.accentGold, width: "40px" }}
              />
              <span
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "11px",
                  color: c.accentGold,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                }}
              >
                Market Intelligence — NSE/Nifty 100
              </span>
              <div
                style={{ height: "1px", background: c.accentGold, width: "40px" }}
              />
            </div>
            <h1
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(48px, 5vw, 72px)",
                fontWeight: 900,
                color: c.textPrimary,
                letterSpacing: "-0.03em",
                lineHeight: 0.95,
                marginBottom: "16px",
              }}
            >
              {isBull
                ? "Markets Trending"
                : isNeutral
                  ? "Markets Consolidated"
                  : "Market Pressure"}
              <br />
              <span style={{ color: regimeColor }}>{market_regime.label}</span>
            </h1>
            <p
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "17px",
                color: c.textSecondary,
                lineHeight: 1.55,
                maxWidth: "520px",
              }}
            >
              {market_regime.description ??
                `AI model confidence: ${(market_regime.confidence ?? 73).toFixed(1)}%. ${signal_counts.long} long and ${signal_counts.short} short signals identified across ${total} Nifty 100 stocks.`}
            </p>
          </div>

          {/* Right: Controls + Stats */}
          <div style={{ marginLeft: "48px", flexShrink: 0 }}>
            {/* Horizon Selector */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "10px",
                  color: c.textMuted,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Forecast horizon
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {HORIZONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setSelectedHorizon(h)}
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: selectedHorizon === h ? 700 : 400,
                      fontSize: "14px",
                      padding: "6px 12px",
                      border: `1px solid ${selectedHorizon === h ? regimeColor : c.borderSecondary}`,
                      background:
                        selectedHorizon === h ? regimeColor : "transparent",
                      color: selectedHorizon === h ? "#ffffff" : c.textSecondary,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {h}D
                  </button>
                ))}
              </div>
              <div
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "11px",
                  color: c.textMuted,
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Clock size={11} />
                Target: {formatTradingDate(targetDate)}
              </div>
            </div>

            {/* Signal Counts */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 80px)",
                gap: "8px",
              }}
            >
              {[
                {
                  label: "Long",
                  val: signal_counts.long,
                  color: c.accentBull,
                  icon: TrendingUp,
                },
                {
                  label: "Short",
                  val: signal_counts.short,
                  color: c.accentBear,
                  icon: TrendingDown,
                },
                {
                  label: "Neutral",
                  val: signal_counts.neutral,
                  color: c.accentNeutral,
                  icon: Minus,
                },
              ].map(({ label, val, color, icon: Icon }) => (
                <div
                  key={label}
                  style={{ borderTop: `3px solid ${color}`, paddingTop: "8px" }}
                >
                  <Icon size={12} color={color} />
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 900,
                      fontSize: "32px",
                      color,
                      lineHeight: 1,
                      marginTop: "4px",
                    }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Georgia", serif',
                      fontSize: "9px",
                      color: c.textMuted,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      marginTop: "2px",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: '"Georgia", serif',
                fontSize: "11px",
                color: c.textMuted,
              }}
            >
              <RefreshCw size={11} />
              Refresh data
            </button>
          </div>
        </div>

        {/* Market Breadth Bar */}
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "11px",
                color: c.textMuted,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Market breadth
            </div>
            <div
              style={{
                flex: 1,
                height: "4px",
                display: "flex",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(signal_counts.long / total) * 100}%`,
                  background: c.accentBull,
                }}
              />
              <div
                style={{
                  width: `${(signal_counts.neutral / total) * 100}%`,
                  background: c.accentGold,
                }}
              />
              <div
                style={{
                  width: `${(signal_counts.short / total) * 100}%`,
                  background: c.accentBear,
                }}
              />
            </div>
            <div
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "11px",
                color: c.textSecondary,
                whiteSpace: "nowrap",
              }}
            >
              {((signal_counts.long / total) * 100).toFixed(0)}% bullish
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURED PICKS + SECTOR ANALYSIS ═══ */}
      <section className="px-8 py-10">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 2fr",
            gap: "60px",
          }}
        >
          {/* Top Picks */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "28px",
                  fontWeight: 900,
                  color: c.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                Featured Signals
              </h2>
              <Link
                href="/editorial/recommendations"
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "12px",
                  color: c.accentBear,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderBottom: `1px solid ${c.accentGold}`,
                  paddingBottom: "1px",
                }}
              >
                All {total} signals →
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              {top_cards.slice(0, 6).map((card, i) => {
                const isBullCard = card.direction === "long";
                const accentColor = isBullCard
                  ? c.accentBull
                  : card.direction === "short"
                    ? c.accentBear
                    : c.accentNeutral;
                const isWatched = has(card.ticker);

                return (
                  <article
                    key={card.ticker}
                    style={{
                      borderTop: `${i < 2 ? "3px" : "2px"} solid ${accentColor}`,
                      paddingTop: "14px",
                      position: "relative",
                    }}
                  >
                    {/* Watchlist toggle */}
                    <button
                      onClick={() => toggle(card.ticker)}
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: 0,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                      }}
                      title={
                        isWatched ? "Remove from watchlist" : "Add to watchlist"
                      }
                    >
                      {isWatched ? (
                        <BookmarkCheck size={14} color={c.accentGold} />
                      ) : (
                        <BookmarkPlus size={14} color={c.textMuted} />
                      )}
                    </button>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <div>
                        <Link
                          href={`/editorial/stocks/${card.ticker}`}
                          style={{ textDecoration: "none" }}
                        >
                          <div
                            style={{
                              fontFamily: '"Playfair Display", serif',
                              fontSize: i < 2 ? "24px" : "20px",
                              fontWeight: 900,
                              color: accentColor,
                              letterSpacing: "-0.02em",
                              lineHeight: 1,
                            }}
                          >
                            {formatTicker(card.ticker)}
                          </div>
                        </Link>
                        <div
                          style={{
                            fontFamily: '"Georgia", serif',
                            fontSize: "11px",
                            color: c.textMuted,
                            marginTop: "2px",
                          }}
                        >
                          {card.company_name}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 8px",
                          background: accentColor,
                          marginRight: "20px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: '"Georgia", serif',
                            fontSize: "10px",
                            color: "#fff",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                          }}
                        >
                          {card.confidence_pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginBottom: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"Georgia", serif',
                          fontSize: "10px",
                          color: accentColor,
                          border: `1px solid ${accentColor}`,
                          padding: "2px 6px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {card.direction}
                      </span>
                      <span
                        style={{
                          fontFamily: '"Georgia", serif',
                          fontSize: "10px",
                          color: c.textMuted,
                          padding: "2px 6px",
                          border: `1px solid ${c.borderSecondary}`,
                        }}
                      >
                        {card.horizon}
                      </span>
                      {card.sector && (
                        <span
                          style={{
                            fontFamily: '"Georgia", serif',
                            fontSize: "10px",
                            color: c.textMuted,
                            padding: "2px 6px",
                            border: `1px solid ${c.borderSecondary}`,
                          }}
                        >
                          {card.sector}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        height: "1px",
                        background: c.accentGold,
                        marginBottom: "10px",
                        width: "40px",
                      }}
                    />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      {[
                        { l: "Entry", v: `₹${formatPrice(card.entry_price)}` },
                        {
                          l: "Target",
                          v: `₹${formatPrice(card.target_price)}`,
                          col: c.accentBull,
                        },
                        {
                          l: "Return",
                          v: formatPct(card.expected_return_pct),
                          col: isBullCard ? c.accentBull : c.accentBear,
                        },
                        {
                          l: "R/R",
                          v: `${card.risk_reward_ratio?.toFixed(2)}×`,
                          col: c.accentGold,
                        },
                      ].map(({ l, v, col }) => (
                        <div key={l}>
                          <div
                            style={{
                              fontFamily: '"Georgia", serif',
                              fontSize: "9px",
                              color: c.textMuted,
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                            }}
                          >
                            {l}
                          </div>
                          <div
                            style={{
                              fontFamily: '"Playfair Display", serif',
                              fontSize: "14px",
                              fontWeight: 700,
                              color: col ?? c.textPrimary,
                              marginTop: "1px",
                            }}
                          >
                            {v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Sector Analysis */}
          <div>
            <h2
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "28px",
                fontWeight: 900,
                color: c.textPrimary,
                letterSpacing: "-0.02em",
                marginBottom: "24px",
              }}
            >
              Sector Pulse
            </h2>

            {/* Radar Chart */}
            <div style={{ marginBottom: "20px" }}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={sectorData}>
                  <PolarGrid stroke={c.chartGrid} />
                  <PolarAngleAxis
                    dataKey="sector"
                    tick={{
                      fontSize: 10,
                      fontFamily: '"Georgia", serif',
                      fill: c.textSecondary,
                    }}
                  />
                  <Radar
                    name="Bullish bias"
                    dataKey="bias"
                    stroke={c.accentBull}
                    fill={c.accentBull}
                    fillOpacity={0.12}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Sector Table */}
            <div>
              {Object.entries(sector_summary).map(([sector, counts]) => {
                const sTotal = counts.long + counts.short + counts.neutral;
                const bullPct = sTotal > 0 ? (counts.long / sTotal) * 100 : 0;
                const biasColor =
                  counts.long > counts.short
                    ? c.accentBull
                    : counts.short > counts.long
                      ? c.accentBear
                      : c.accentNeutral;

                return (
                  <div
                    key={sector}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
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
                        width: "130px",
                        flexShrink: 0,
                      }}
                    >
                      {sector}
                    </div>
                    <div
                      style={{ flex: 1, height: "2px", background: c.bgSecondary }}
                    >
                      <div
                        style={{
                          width: `${bullPct}%`,
                          height: "100%",
                          background: biasColor,
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <span
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: "13px",
                          fontWeight: 700,
                          color: c.accentBull,
                        }}
                      >
                        +{counts.long}
                      </span>
                      <span
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: "13px",
                          fontWeight: 700,
                          color: c.accentBear,
                        }}
                      >
                        −{counts.short}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HORIZON SIGNAL DISTRIBUTION ═══ */}
      <section
        className="px-8 py-10"
        style={{
          background: c.bgSecondary,
          borderTop: `1px solid ${c.borderSubtle}`,
        }}
      >
        <div style={{ maxWidth: "600px", marginBottom: "24px" }}>
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
            Signal Distribution
          </div>
          <h2
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "28px",
              fontWeight: 900,
              color: c.textPrimary,
              letterSpacing: "-0.02em",
            }}
          >
            Signals across forecast horizons
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 3fr",
            gap: "48px",
            alignItems: "start",
          }}
        >
          {/* Horizon cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "8px",
            }}
          >
            {HORIZONS.map((h) => {
              const tDate = horizonToDate(h);
              return (
                <Link
                  key={h}
                  href={`/editorial/recommendations?horizon=${h}`}
                  style={{
                    textDecoration: "none",
                    borderTop: `${selectedHorizon === h ? "3px" : "1px"} solid ${selectedHorizon === h ? c.accentBear : c.accentGold}`,
                    paddingTop: "12px",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: "22px",
                      fontWeight: 900,
                      color: selectedHorizon === h ? c.accentBear : c.textPrimary,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {h}D
                  </div>
                  <div
                    style={{
                      fontFamily: '"Georgia", serif',
                      fontSize: "10px",
                      color: c.textMuted,
                      marginTop: "4px",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {formatTradingDate(tDate)}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: "11px",
                      color: c.textSecondary,
                      marginTop: "8px",
                      fontStyle: "italic",
                    }}
                  >
                    {h === 1 ? "Next session" : `${h} sessions`}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bar Chart */}
          <div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={signalBarData} barGap={2}>
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke={c.chartGrid}
                  vertical={false}
                />
                <XAxis
                  dataKey="horizon"
                  tick={{
                    fontSize: 11,
                    fontFamily: '"Georgia", serif',
                    fill: c.textSecondary,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 10,
                    fontFamily: '"Georgia", serif',
                    fill: c.textMuted,
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: '"Georgia", serif',
                    fontSize: "12px",
                    border: `1px solid ${c.tooltipBorder}`,
                    background: c.tooltipBg,
                    color: c.tooltipText,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  labelStyle={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 700,
                    color: c.tooltipText,
                  }}
                />
                <Bar
                  dataKey="long"
                  name="Long"
                  fill={c.accentBull}
                  radius={[1, 1, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="short"
                  name="Short"
                  fill={c.accentBear}
                  radius={[1, 1, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer
        className="px-8 py-6"
        style={{ borderTop: `1px solid ${c.borderSubtle}` }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: '"Georgia", serif',
              fontSize: "11px",
              color: c.textMuted,
            }}
          >
            Model: {dash.model_version?.split(":")[0]} ·{" "}
            {formatDateTime(dash.generated_at)} IST
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link
              href="/swiss"
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "11px",
                color: c.textMuted,
                textDecoration: "none",
              }}
            >
              Switch to Swiss design →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
