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
import { useSwissTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import { RefreshCw, BookmarkPlus, BookmarkCheck, Clock } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

const HV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function SwissDashboard() {
  const [horizon, setHorizon] = useState(1);
  const { data: dash, loading, refetch } = useDashboard({ horizon, top_n: 10 });
  const { toggle, has } = useWatchlist();
  const c = useSwissTheme();

  if (loading || !dash) {
    return (
      <div className="py-12">
        {[80, 30, 400, 30].map((h, i) => (
          <div
            key={i}
            style={{
              height: h,
              background: `linear-gradient(90deg, ${c.shimmerStart} 0%, ${c.shimmerMid} 50%, ${c.shimmerStart} 100%)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              marginBottom: "16px",
            }}
          />
        ))}
      </div>
    );
  }

  const { signal_counts, market_regime, top_cards, sector_summary } = dash;
  const isBull = market_regime.label?.toUpperCase().includes("BULL");
  const regimeColor = isBull ? c.accentCyan : c.accentRed;
  const total = signal_counts.long + signal_counts.short + signal_counts.neutral;
  const targetDate = horizonToDate(horizon);

  const sectorChartData = Object.entries(sector_summary).map(
    ([sector, counts]) => ({
      sector: sector.split(" ")[0],
      long: counts.long,
      short: counts.short,
      bias: signalBiasRatio(counts.long, counts.short) * 100,
    }),
  );

  return (
    <div className="py-12">
      {/* ═══ HEADER ═══ */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "48px",
            alignItems: "end",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: HV,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: c.textSecondary,
                marginBottom: "12px",
              }}
            >
              NSE/Nifty 100 Intelligence · {formatDateTime(dash.generated_at)}
            </div>
            <h1
              style={{
                fontFamily: HV,
                fontSize: "clamp(44px, 5vw, 68px)",
                fontWeight: 900,
                color: c.textPrimary,
                letterSpacing: "-0.04em",
                lineHeight: 0.9,
                marginBottom: "16px",
              }}
            >
              {total} Signals,{" "}
              <span style={{ color: regimeColor }}>{market_regime.label}</span>{" "}
              Bias
            </h1>
            <p
              style={{
                fontFamily: HV,
                fontSize: "15px",
                color: c.textSecondary,
                maxWidth: "400px",
                lineHeight: 1.45,
              }}
            >
              {market_regime.description ??
                `Model confidence ${(market_regime.confidence ?? 73).toFixed(1)}%. ${signal_counts.long} bullish, ${signal_counts.short} bearish signals identified.`}
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            {/* Horizon selector */}
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontFamily: HV,
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: c.textMuted,
                  marginBottom: "6px",
                }}
              >
                Horizon
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {[1, 3, 5, 7, 10].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    style={{
                      fontFamily: HV,
                      fontSize: "11px",
                      fontWeight: horizon === h ? 700 : 400,
                      padding: "4px 8px",
                      background: horizon === h ? c.textPrimary : "transparent",
                      border: `1px solid ${horizon === h ? c.textPrimary : c.borderSecondary}`,
                      color: horizon === h ? c.bgPrimary : c.textSecondary,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}D
                  </button>
                ))}
              </div>
              <div
                style={{
                  fontFamily: HV,
                  fontSize: "10px",
                  color: c.textMuted,
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  justifyContent: "flex-end",
                }}
              >
                <Clock size={10} /> {formatTradingDate(targetDate)}
              </div>
            </div>

            {/* Signal counts */}
            <div style={{ display: "flex", gap: "20px" }}>
              {[
                { l: "Long", v: signal_counts.long, col: c.accentCyan },
                { l: "Short", v: signal_counts.short, col: c.accentRed },
                { l: "Neutral", v: signal_counts.neutral, col: c.textPrimary },
              ].map(({ l, v, col }) => (
                <div
                  key={l}
                  style={{
                    borderTop: `2px solid ${col}`,
                    paddingTop: "6px",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      fontFamily: HV,
                      fontSize: "32px",
                      fontWeight: 900,
                      color: col,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {v}
                  </div>
                  <div
                    style={{
                      fontFamily: HV,
                      fontSize: "10px",
                      color: c.textSecondary,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Breadth ruler */}
        <div
          style={{
            height: "2px",
            background: c.borderSubtle,
            marginTop: "24px",
            display: "flex",
          }}
        >
          <div
            style={{
              width: `${(signal_counts.long / total) * 100}%`,
              height: "100%",
              background: c.accentCyan,
            }}
          />
          <div
            style={{
              width: `${(signal_counts.neutral / total) * 100}%`,
              height: "100%",
              background: c.borderSecondary,
            }}
          />
          <div
            style={{
              width: `${(signal_counts.short / total) * 100}%`,
              height: "100%",
              background: c.accentRed,
            }}
          />
        </div>

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: HV,
            fontSize: "10px",
            color: c.textMuted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <RefreshCw size={10} /> Refresh
        </button>
      </div>

      {/* ═══ SECTION RULE ═══ */}
      <div style={{ height: "2px", background: c.textPrimary, marginBottom: "32px" }} />

      {/* ═══ MAIN GRID ═══ */}
      <div
        style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: "48px" }}
      >
        {/* Top Signals Table */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                fontFamily: HV,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: c.textPrimary,
              }}
            >
              Top Signals
            </div>
            <Link
              href="/swiss/recommendations"
              style={{
                fontFamily: HV,
                fontSize: "10px",
                color: c.accentRed,
                textDecoration: "underline",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              ALL
            </Link>
          </div>

          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2.5fr 4.5rem 4rem 4rem 4rem 3rem 3rem",
              gap: "12px",
              borderTop: `2px solid ${c.textPrimary}`,
              borderBottom: `2px solid ${c.textPrimary}`,
              padding: "8px 0",
              fontFamily: HV,
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: c.textSecondary,
            }}
          >
            <div>Ticker</div>
            <div>Company</div>
            <div style={{ textAlign: "right" }}>Conf.</div>
            <div style={{ textAlign: "right" }}>Return</div>
            <div style={{ textAlign: "right" }}>Entry</div>
            <div style={{ textAlign: "right" }}>Target</div>
            <div style={{ textAlign: "center" }}>Chart</div>
            <div style={{ textAlign: "center" }}>WL</div>
          </div>

          {top_cards.map((card) => {
            const isBullCard = card.direction === "long";
            const rowColor = isBullCard
              ? c.accentCyan
              : card.direction === "short"
                ? c.accentRed
                : c.textPrimary;
            const isWatched = has(card.ticker);

            return (
              <div
                key={card.ticker}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2.5fr 4.5rem 4rem 4rem 4rem 3rem 3rem",
                  gap: "12px",
                  padding: "10px 0",
                  borderBottom: `1px solid ${c.borderSubtle}`,
                  alignItems: "center",
                  fontFamily: HV,
                }}
              >
                <div>
                  <Link
                    href={`/swiss/stocks/${card.ticker}`}
                    style={{
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: rowColor,
                    }}
                  >
                    {formatTicker(card.ticker)}
                  </Link>
                  <div
                    style={{
                      fontSize: "10px",
                      color: rowColor,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginTop: "1px",
                    }}
                  >
                    {card.direction} · {card.horizon}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: c.textSecondary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {card.company_name}
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: rowColor,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {card.confidence_pct.toFixed(0)}%
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: isBullCard ? c.accentCyan : c.accentRed,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatPct(card.expected_return_pct)}
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "12px",
                    color: c.textSecondary,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ₹{formatPrice(card.entry_price)}
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "12px",
                    color: c.accentCyan,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ₹{formatPrice(card.target_price)}
                </div>
                <div style={{ textAlign: "center" }}>
                  <Link
                    href={`/swiss/chart/${card.ticker}`}
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: c.accentRed,
                      textDecoration: "none",
                      padding: "2px 4px",
                      border: `1px solid ${c.accentRed}`,
                      letterSpacing: "0.05em",
                    }}
                  >
                    CHART
                  </Link>
                </div>
                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => toggle(card.ticker)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                  >
                    {isWatched ? (
                      <BookmarkCheck size={12} color={c.accentRed} />
                    ) : (
                      <BookmarkPlus size={12} color={c.textMuted} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sector Panel */}
        <div>
          <div
            style={{
              fontFamily: HV,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: c.textPrimary,
              marginBottom: "8px",
              borderBottom: `2px solid ${c.textPrimary}`,
              paddingBottom: "6px",
            }}
          >
            Sector Bias
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={sectorChartData}
              layout="vertical"
              margin={{ left: 0, right: 8 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 9, fontFamily: HV, fill: c.textMuted }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="sector"
                tick={{ fontSize: 9, fontFamily: HV, fill: c.textSecondary }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: HV,
                  fontSize: "11px",
                  border: `1px solid ${c.textPrimary}`,
                  background: c.tooltipBg,
                  color: c.tooltipText,
                }}
                formatter={(v) => [`${(v as number).toFixed(0)}%`, "Bull bias"]}
              />
              <Bar dataKey="bias" radius={[0, 1, 1, 0]} maxBarSize={10}>
                {sectorChartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      d.bias > 60 ? c.accentCyan : d.bias < 40 ? c.accentRed : c.textMuted
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ height: "1px", background: c.textPrimary, margin: "12px 0" }} />

          {Object.entries(sector_summary)
            .slice(0, 8)
            .map(([sector, counts]) => (
              <div
                key={sector}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "8px",
                  marginBottom: "8px",
                  borderBottom: `1px solid ${c.borderSubtle}`,
                  fontFamily: HV,
                }}
              >
                <div style={{ fontSize: "11px", color: c.textSecondary }}>
                  {sector}
                </div>
                <div style={{ fontSize: "11px", display: "flex", gap: "8px" }}>
                  <span style={{ color: c.accentCyan, fontWeight: 700 }}>
                    +{counts.long}
                  </span>
                  <span style={{ color: c.accentRed, fontWeight: 700 }}>
                    −{counts.short}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: "1px", background: c.borderSecondary, margin: "32px 0 16px" }} />
      <div
        style={{
          fontFamily: HV,
          fontSize: "10px",
          color: c.textMuted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Model: {dash.model_version?.split(":")[0]}</span>
      </div>
    </div>
  );
}
