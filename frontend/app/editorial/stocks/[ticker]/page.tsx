"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useStockDeepDive } from "@/lib/api/hooks";
import { MOCK_CARDS } from "@/lib/mock/data";
import {
  formatTicker,
  formatPrice,
  formatPct,
  formatDate,
  formatDateTime,
} from "@/lib/utils/format";
import {
  horizonToDate,
  formatTradingDate,
  SECTOR_MAP,
} from "@/lib/utils/trading";
import { useWatchlist } from "@/lib/utils/watchlist";
import OHLCVChart, { OverlayToggle } from "@/components/shared/OHLCVChart";
import { useEditorialTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import {
  BookmarkPlus,
  BookmarkCheck,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

export default function EditorialStockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const { data: dive, loading } = useStockDeepDive(ticker, 90);
  const { toggle, has } = useWatchlist();

  // Find card info from mock for initial display
  const mockCard = MOCK_CARDS.find((c) => c.ticker === ticker) ?? MOCK_CARDS[0];

  const [overlays, setOverlays] = useState({
    sma20: true,
    sma50: true,
    bollingerBands: false,
    vwap: false,
  });
  const [lookback, setLookback] = useState<30 | 60 | 90>(60);
  const toggle2 = (k: keyof typeof overlays) =>
    setOverlays((p) => ({ ...p, [k]: !p[k] }));
  const c = useEditorialTheme();
  const isWatched = has(ticker);

  if (loading || !dive) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: i === 2 ? 400 : 80, background: `linear-gradient(90deg, ${c.shimmerStart} 0%, ${c.shimmerMid} 50%, ${c.shimmerStart} 100%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: "2px", marginBottom: "16px" }} />
        ))}
      </div>
    );
  }

  // Determine primary direction from predictions
  const primaryPred =
    dive.predictions["1"] ??
    dive.predictions["1d"] ??
    Object.values(dive.predictions)[0];
  const isBull = primaryPred?.direction === "long";
  const accentColor = isBull ? c.accentBull : primaryPred?.direction === "short" ? c.accentBear : c.accentNeutral;

  // Horizon predictions as array for comparison
  const horizonPreds = [1, 3, 5, 7, 10].map((h) => {
    const p =
      dive.predictions[String(h)] ??
      dive.predictions[`${h}d`] ??
      Object.values(dive.predictions)[0];
    const tDate = horizonToDate(h);
    return {
      horizon: `${h}D`,
      daysNum: h,
      date: formatTradingDate(tDate),
      direction: p?.direction ?? "neutral",
      confidence: p?.confidence_pct ?? 0,
      return: p?.expected_return_pct ?? 0,
      target: p?.target_price ?? 0,
      stop: p?.stop_loss ?? 0,
      entry: p?.entry_price ?? dive.current_price,
      color: p?.direction === "long" ? c.accentBull : p?.direction === "short" ? c.accentBear : c.accentNeutral,
    };
  });

  // Price changes for chart
  const priceChanges = dive.chart.slice(-20).map((pt, i, arr) => ({
    date: pt.date,
    pct: i === 0 ? 0 : ((pt.close - arr[0].close) / arr[0].close) * 100,
  }));

  // Peer comparison
  const peers = Object.entries(dive.peer_comparison).map(([sym, data]) => {
    const d = data as Record<string, unknown>;
    return {
      ticker: sym,
      price: d.price as number,
      return1m: d.return_1m as number,
      direction: d.direction as string,
      confidence: d.confidence as number,
    };
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="px-8 pt-8 pb-4" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: '"Georgia", serif', fontSize: "11px", color: c.textMuted }}>
          <Link href="/editorial" style={{ color: c.accentGold, textDecoration: "none" }}>Overview</Link>
          <span>›</span>
          <Link href="/editorial/recommendations" style={{ color: c.accentGold, textDecoration: "none" }}>Signals</Link>
          <span>›</span>
          <span style={{ color: c.textSecondary }}>{formatTicker(ticker)}</span>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section
        className="px-8 py-10"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 2fr",
            gap: "60px",
          }}
        >
          <div>
            {/* Kicker line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "10px",
                  color: "#fff",
                  background: accentColor,
                  padding: "3px 10px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                {primaryPred?.direction?.toUpperCase() ?? "NEUTRAL"}
              </div>
              {SECTOR_MAP[ticker] && (
                <div
                  style={{
                    fontFamily: '"Georgia", serif',
                    fontSize: "10px",
                    color: "#bbb",
                    border: "1px solid #e8e8e4",
                    padding: "3px 8px",
                  }}
                >
                  {SECTOR_MAP[ticker]}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: '"Georgia", serif',
                  fontSize: "11px",
                  color: accentColor,
                }}
              >
                <Clock size={11} /> {formatTradingDate(horizonToDate(1))}
              </div>
            </div>

            {/* Big ticker + company */}
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <h1
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(56px, 6vw, 80px)",
                  fontWeight: 900,
                  color: accentColor,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.85,
                }}
              >
                {formatTicker(ticker)}
              </h1>
              <button
                onClick={() => toggle(ticker)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
                title={isWatched ? "Remove" : "Add to watchlist"}
              >
                {isWatched ? (
                  <BookmarkCheck size={20} color="#d4af37" />
                ) : (
                  <BookmarkPlus size={20} color="#cccccc" />
                )}
              </button>
            </div>
            <div
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "20px",
                color: "#6b6b68",
                marginTop: "8px",
                marginBottom: "20px",
              }}
            >
              {dive.company_name}
            </div>

            {/* Current price */}
            <div
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "44px",
                fontWeight: 900,
                color: "#1a1a18",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              ₹{formatPrice(dive.current_price)}
            </div>

            {/* Confidence badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  height: "4px",
                  flex: 1,
                  maxWidth: "160px",
                  background: c.bgSecondary,
                }}
              >
                <div
                  style={{
                    width: `${primaryPred?.confidence_pct ?? 70}%`,
                    height: "100%",
                    background: `linear-gradient(to right, ${accentColor}60, ${accentColor})`,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "15px",
                  fontWeight: 700,
                  color: accentColor,
                }}
              >
                {primaryPred?.confidence_pct?.toFixed(1)}% Confidence
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div
            style={{
              borderTop: `4px solid ${accentColor}`,
              paddingTop: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {[
                {
                  label: "Entry Price",
                  value: `₹${formatPrice(primaryPred?.entry_price)}`,
                },
                {
                  label: "Target",
                  value: `₹${formatPrice(primaryPred?.target_price)}`,
                  col: c.accentBull,
                },
                {
                  label: "Stop Loss",
                  value: `₹${formatPrice(primaryPred?.stop_loss)}`,
                  col: c.accentBear,
                },
                {
                  label: "Exp. Return",
                  value: formatPct(primaryPred?.expected_return_pct),
                  col: isBull ? c.accentBull : c.accentBear,
                },
                {
                  label: "Support",
                  value: `₹${formatPrice((dive.support_resistance?.support as number[])?.[0])}`,
                },
                {
                  label: "Resistance",
                  value: `₹${formatPrice((dive.support_resistance?.resistance as number[])?.[0])}`,
                  col: c.accentBear,
                },
              ].map(({ label, value, col }) => (
                <div key={label} style={{ paddingBottom: "14px", borderBottom: `1px solid ${c.borderSubtle}` }}>
                  <div style={{ fontFamily: '"Georgia", serif', fontSize: "9px", color: c.textMuted, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: "16px", fontWeight: 700, color: col ?? c.textPrimary }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Generated at */}
            <div
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "11px",
                color: c.textMuted,
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Clock size={11} /> Updated {formatDateTime(dive.generated_at)}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ OHLCV CHART ═══ */}
      <section
        className="px-8 py-10"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "28px",
              fontWeight: 900,
              color: "#1a1a18",
            }}
          >
            Price History
          </h2>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Lookback */}
            <div style={{ display: "flex", gap: "4px" }}>
              {([30, 60, 90] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLookback(l)}
                  style={{
                    fontFamily: '"Georgia", serif',
                    fontSize: "11px",
                    padding: "4px 8px",
                    background: lookback === l ? "#722f37" : "transparent",
                    border: `1px solid ${lookback === l ? "#722f37" : "#d8d5d0"}`,
                    color: lookback === l ? "#fff" : "#666",
                    cursor: "pointer",
                  }}
                >
                  {l}D
                </button>
              ))}
            </div>
            {/* Overlays */}
            <div style={{ display: "flex", gap: "6px" }}>
              {(["sma20", "sma50", "bollingerBands", "vwap"] as const).map(
                (k) => (
                  <OverlayToggle
                    key={k}
                    label={
                      {
                        sma20: "SMA 20",
                        sma50: "SMA 50",
                        bollingerBands: "Bollinger",
                        vwap: "VWAP",
                      }[k]
                    }
                    active={overlays[k]}
                    color={c.accentBear}
                    onClick={() => toggle2(k)}
                    style="editorial"
                  />
                ),
              )}
            </div>
          </div>
        </div>
        <OHLCVChart
          data={dive.chart.slice(-lookback)}
          theme="editorial"
          height={400}
          overlays={overlays}
          showVolume
        />
      </section>

      {/* ═══ MULTI-HORIZON FORECAST ═══ */}
      <section
        className="px-8 py-10"
        style={{
          background: c.bgSecondary,
          borderBottom: `1px solid ${c.borderSubtle}`,
        }}
      >
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "28px",
              fontWeight: 900,
              color: c.textPrimary,
            }}
          >
            Forecast Horizons
          </h2>
          <div
            style={{
              fontFamily: '"Georgia", serif',
              fontStyle: "italic",
              fontSize: "14px",
              color: c.textSecondary,
            }}
          >
            1 day to 2 trading weeks
          </div>
        </div>

        {/* Grid of horizon cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {horizonPreds.map((h) => (
            <div
              key={h.horizon}
              style={{
                borderTop: `3px solid ${h.color}`,
                paddingTop: "14px",
                background: c.bgCard,
                padding: "14px",
              }}
            >
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "30px",
                  fontWeight: 900,
                  color: h.color,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {h.horizon}
              </div>
              <div
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "10px",
                  color: c.textMuted,
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <Clock size={9} /> {h.date}
              </div>
              <div
                style={{
                  height: "1px",
                  background: c.accentGold,
                  margin: "10px 0",
                  width: "24px",
                }}
              />
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "22px",
                  fontWeight: 900,
                  color: h.color,
                }}
              >
                {h.confidence.toFixed(0)}%
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
                confidence
              </div>
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "16px",
                    fontWeight: 700,
                    color: h.color,
                  }}
                >
                  {formatPct(h.return)}
                </div>
                <div
                  style={{
                    fontFamily: '"Georgia", serif',
                    fontSize: "9px",
                    color: "#bbb",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  expected
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px",
                  marginTop: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: '"Georgia", serif',
                      fontSize: "9px",
                      color: "#bbb",
                    }}
                  >
                    Target
                  </div>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#004225",
                    }}
                  >
                    ₹{formatPrice(h.target)}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: '"Georgia", serif',
                      fontSize: "9px",
                      color: "#bbb",
                    }}
                  >
                    Stop
                  </div>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#722f37",
                    }}
                  >
                    ₹{formatPrice(h.stop)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confidence comparison chart */}
        <div
          style={{
            height: "1px",
            background: "rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        />
        <div
          style={{
            fontFamily: '"Georgia", serif',
            fontSize: "10px",
            color: "#bbb",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Confidence by horizon
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={horizonPreds} barSize={40}>
            <CartesianGrid
              strokeDasharray="2 2"
              stroke="rgba(0,0,0,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="horizon"
              tick={{
                fontSize: 11,
                fontFamily: '"Georgia", serif',
                fill: "#6b6b68",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[50, 100]}
              tick={{
                fontSize: 10,
                fontFamily: '"Georgia", serif',
                fill: "#bbb",
              }}
              axisLine={false}
              tickLine={false}
              width={30}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                fontFamily: '"Georgia", serif',
                fontSize: "12px",
                border: "1px solid #d4af37",
              }}
              formatter={(v) => [`${v}%`, "Confidence"]}
            />
            <Bar dataKey="confidence" radius={[2, 2, 0, 0]}>
              {horizonPreds.map((h, i) => (
                <Cell key={i} fill={h.color} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* ═══ INDICATORS + SUPPORT/RESISTANCE ═══ */}
      <section className="px-8 py-10">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "48px",
          }}
        >
          {/* Key Indicators */}
          <div>
            <div
              style={{
                borderTop: "3px solid #d4af37",
                paddingTop: "14px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <BarChart2 size={14} color="#d4af37" />
                <h3
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "20px",
                    fontWeight: 900,
                    color: "#1a1a18",
                  }}
                >
                  Key Indicators
                </h3>
              </div>
            </div>
            {Object.entries(dive.key_indicators)
              .filter(([, v]) => v !== null)
              .slice(0, 10)
              .map(([key, val]) => {
                const v = val as number;
                const rsiColor = key.includes("rsi")
                  ? v > 70
                    ? "#722f37"
                    : v < 30
                      ? "#004225"
                      : "#6b6b68"
                  : "#1a1a18";
                const name = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "10px",
                      marginBottom: "10px",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "12px",
                        color: "#6b6b68",
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "14px",
                        fontWeight: 700,
                        color: rsiColor,
                      }}
                    >
                      {v.toFixed(2)}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Support & Resistance */}
          <div>
            <div
              style={{
                borderTop: "3px solid #722f37",
                paddingTop: "14px",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "20px",
                  fontWeight: 900,
                  color: "#1a1a18",
                }}
              >
                Support & Resistance
              </h3>
            </div>
            {((dive.support_resistance?.resistance as number[]) ?? [])
              .slice(0, 3)
              .map((r, i) => (
                <div
                  key={`r${i}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "10px",
                    marginBottom: "10px",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <TrendingDown size={11} color="#722f37" />
                    <span
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "12px",
                        color: "#722f37",
                      }}
                    >
                      Resistance {i + 1}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#722f37",
                    }}
                  >
                    ₹{formatPrice(r)}
                  </div>
                </div>
              ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: "10px",
                marginBottom: "10px",
                borderBottom: "2px solid #000",
              }}
            >
              <span
                style={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1a1a18",
                }}
              >
                Current Price
              </span>
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "16px",
                  fontWeight: 900,
                  color: "#1a1a18",
                }}
              >
                ₹{formatPrice(dive.current_price)}
              </div>
            </div>
            {((dive.support_resistance?.support as number[]) ?? [])
              .slice(0, 3)
              .map((s, i) => (
                <div
                  key={`s${i}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "10px",
                    marginBottom: "10px",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <TrendingUp size={11} color="#004225" />
                    <span
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "12px",
                        color: "#004225",
                      }}
                    >
                      Support {i + 1}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#004225",
                    }}
                  >
                    ₹{formatPrice(s)}
                  </div>
                </div>
              ))}
          </div>

          {/* Peer Comparison */}
          <div>
            <div
              style={{
                borderTop: "3px solid #004225",
                paddingTop: "14px",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "20px",
                  fontWeight: 900,
                  color: "#1a1a18",
                }}
              >
                Peer Comparison
              </h3>
            </div>
            {peers.map((p) => {
              const pColor =
                p.direction === "long"
                  ? "#004225"
                  : p.direction === "short"
                    ? "#722f37"
                    : "#6b6b68";
              return (
                <div
                  key={p.ticker}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "14px",
                    marginBottom: "14px",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "15px",
                        fontWeight: 900,
                        color: pColor,
                      }}
                    >
                      {formatTicker(p.ticker)}
                    </div>
                    <div
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "11px",
                        color: formatPct(p.return1m) ? "#6b6b68" : "#bbb",
                      }}
                    >
                      {formatPct(p.return1m)} (1M)
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#1a1a18",
                      }}
                    >
                      ₹{formatPrice(p.price)}
                    </div>
                    <div
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "10px",
                        color: pColor,
                      }}
                    >
                      {p.confidence?.toFixed(0)}% conf
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ NEWS CATALYSTS ═══ */}
      {dive.news_catalysts && dive.news_catalysts.length > 0 && (
        <section
          className="px-8 py-10"
          style={{
            background: "#f5f4f1",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "28px",
              fontWeight: 900,
              color: "#1a1a18",
              marginBottom: "24px",
            }}
          >
            News Catalysts
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
              gap: "24px",
            }}
          >
            {dive.news_catalysts.map((n, i) => {
              const sColor =
                (n.sentiment as number) > 0.3
                  ? "#004225"
                  : (n.sentiment as number) < -0.1
                    ? "#722f37"
                    : "#6b6b68";
              return (
                <article
                  key={i}
                  style={{
                    borderLeft: `3px solid ${sColor}`,
                    paddingLeft: "16px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"Georgia", serif',
                      fontSize: "10px",
                      color: "#bbb",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    {formatDate(n.date as string)}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Georgia", serif',
                      fontSize: "14px",
                      color: "#1a1a18",
                      lineHeight: 1.5,
                      marginBottom: "8px",
                    }}
                  >
                    {n.headline as string}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontStyle: "italic",
                      fontSize: "12px",
                      color: sColor,
                    }}
                  >
                    {(n.sentiment as number) > 0.3
                      ? "Positive"
                      : (n.sentiment as number) < -0.1
                        ? "Negative"
                        : "Neutral"}{" "}
                    sentiment ({(n.sentiment as number).toFixed(2)})
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
