"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useStockDeepDive } from "@/lib/api/hooks";
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
import { useSwissTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import { BookmarkPlus, BookmarkCheck, ArrowLeft, Clock } from "lucide-react";
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

export default function SwissStockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const { data: dive, loading } = useStockDeepDive(ticker, 90);
  const { toggle, has } = useWatchlist();
  const c = useSwissTheme();
  const [overlays, setOverlays] = useState({
    sma20: true,
    sma50: false,
    bollingerBands: false,
    vwap: false,
  });
  const [lookback, setLookback] = useState<30 | 60 | 90>(60);
  const toggleOv = (k: keyof typeof overlays) =>
    setOverlays((p) => ({ ...p, [k]: !p[k] }));

  if (loading || !dive) {
    return (
      <div className="py-12">
        {[60, 400, 60, 200].map((h, i) => (
          <div key={i} style={{ height: h, background: `linear-gradient(90deg, ${c.shimmerStart} 0%, ${c.shimmerMid} 50%, ${c.shimmerStart} 100%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", marginBottom: "16px" }} />
        ))}
      </div>
    );
  }

  const primaryPred =
    dive.predictions["1"] ??
    dive.predictions["1d"] ??
    Object.values(dive.predictions)[0];
  const isBull = primaryPred?.direction === "long";
  const dirColor = isBull ? c.accentCyan : primaryPred?.direction === "short" ? c.accentRed : c.textPrimary;
  const isWatched = has(ticker);

  // Horizons as array
  const horizonPreds = [1, 3, 5, 7, 10].map((h) => {
    const p =
      dive.predictions[String(h)] ??
      dive.predictions[`${h}d`] ??
      Object.values(dive.predictions)[0];
    return {
      h: `${h}D`,
      hNum: h,
      date: formatTradingDate(horizonToDate(h)),
      dir: p?.direction ?? "neutral",
      conf: p?.confidence_pct ?? 0,
      ret: p?.expected_return_pct ?? 0,
      tgt: p?.target_price ?? 0,
      sl: p?.stop_loss ?? 0,
      color: p?.direction === "long" ? c.accentCyan : p?.direction === "short" ? c.accentRed : c.accentNeutral,
    };
  });

  return (
    <div className="py-12">
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: HV, fontSize: "10px", color: c.textMuted, marginBottom: "24px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        <Link href="/swiss" style={{ color: c.accentRed, textDecoration: "none" }}>Dashboard</Link>
        <span>/</span>
        <Link href="/swiss/recommendations" style={{ color: c.accentRed, textDecoration: "none" }}>Signals</Link>
        <span>/</span>
        <span style={{ color: c.textPrimary }}>{formatTicker(ticker)}</span>
      </div>

      {/* ═══ ASYMMETRIC HERO ═══ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "5fr 7fr",
          gap: "48px",
          alignItems: "end",
          marginBottom: "32px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: HV,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#666",
              marginBottom: "8px",
            }}
          >
            {SECTOR_MAP[ticker] ?? "NSE"} ·{" "}
            {primaryPred?.direction?.toUpperCase()} ·{" "}
            {formatTradingDate(horizonToDate(1))}
          </div>
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
          >
            <h1
              style={{
                fontFamily: HV,
                fontSize: "clamp(56px, 7vw, 88px)",
                fontWeight: 900,
                color: dirColor,
                letterSpacing: "-0.05em",
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
            >
              {isWatched ? (
                <BookmarkCheck size={18} color="#da291c" />
              ) : (
                <BookmarkPlus size={18} color="#cccccc" />
              )}
            </button>
          </div>
          <div
            style={{
              fontFamily: HV,
              fontSize: "14px",
              color: c.textSecondary,
              marginTop: "6px",
              marginBottom: "12px",
            }}
          >
            {dive.company_name}
          </div>
          <div style={{ height: "2px", background: dirColor, width: "80px" }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: HV,
              fontSize: "52px",
              fontWeight: 900,
              color: c.textPrimary,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              marginBottom: "8px",
            }}
          >
            ₹{formatPrice(dive.current_price)}
          </div>
          {/* Key stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "6px",
            }}
          >
            {[
              {
                l: "Confidence",
                v: `${primaryPred?.confidence_pct?.toFixed(1)}%`,
                c: dirColor,
              },
              {
                l: "Exp. Return",
                v: formatPct(primaryPred?.expected_return_pct),
                c: isBull ? c.accentCyan : c.accentRed,
              },
              {
                l: "R/R",
                v: primaryPred?.risk_reward_ratio
                  ? `${(primaryPred.risk_reward_ratio as number).toFixed(2)}×`
                  : "—",
              },
              {
                l: "Target",
                v: `₹${formatPrice(primaryPred?.target_price)}`,
                c: c.accentCyan,
              },
            ].map(({ l, v, c: col }) => (
              <div key={l} style={{ borderTop: `2px solid ${col ?? c.textPrimary}`, paddingTop: "8px" }}>
                <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: c.textMuted, marginBottom: "3px" }}>{l}</div>
                <div style={{ fontFamily: HV, fontSize: "16px", fontWeight: 900, color: col ?? c.textPrimary, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: HV, fontSize: "10px", color: c.textMuted, marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={10} /> {formatDateTime(dive.generated_at)}
          </div>
        </div>
      </div>

      <div style={{ height: "2px", background: c.textPrimary, marginBottom: "24px" }} />

      {/* ═══ CHART ═══ */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              fontFamily: HV,
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#666",
            }}
          >
            Price History
          </div>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "3px" }}>
              {([30, 60, 90] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLookback(l)}
                  style={{
                    fontFamily: HV,
                    fontSize: "9px",
                    padding: "3px 7px",
                    background: lookback === l ? c.textPrimary : "transparent",
                    border: `1px solid ${lookback === l ? c.textPrimary : c.borderSecondary}`,
                    color: lookback === l ? c.bgPrimary : c.textSecondary,
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                  }}
                >
                  {l}D
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["sma20", "sma50", "bollingerBands", "vwap"] as const).map(
                (k) => (
                  <OverlayToggle
                    key={k}
                    label={
                      {
                        sma20: "SMA 20",
                        sma50: "SMA 50",
                        bollingerBands: "BB",
                        vwap: "VWAP",
                      }[k]
                    }
                    active={overlays[k]}
                    color="#da291c"
                    onClick={() => toggleOv(k)}
                    style="swiss"
                  />
                ),
              )}
            </div>
          </div>
        </div>
        <OHLCVChart
          data={dive.chart.slice(-lookback)}
          theme="swiss"
          height={380}
          overlays={overlays}
          showVolume
        />
      </div>

      {/* ═══ HORIZON TABLE ═══ */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            fontFamily: HV,
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: c.textPrimary,
            borderBottom: `2px solid ${c.textPrimary}`,
            paddingBottom: "6px",
            marginBottom: "0",
          }}
        >
          Multi-Horizon Forecast
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2rem 3rem 5rem 4.5rem 5.5rem 5rem 5rem 5rem",
            gap: "12px",
            borderBottom: `1px solid ${c.textPrimary}`,
            padding: "6px 0",
            fontFamily: HV,
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: c.textSecondary,
          }}
        >
          <div>HZ</div>
          <div>Date</div>
          <div>Direction</div>
          <div style={{ textAlign: "right" }}>Conf.</div>
          <div style={{ textAlign: "right" }}>Return</div>
          <div style={{ textAlign: "right" }}>Entry</div>
          <div style={{ textAlign: "right" }}>Target</div>
          <div style={{ textAlign: "right" }}>Stop</div>
        </div>
        {horizonPreds.map((h) => (
          <div key={h.h} style={{ display: "grid", gridTemplateColumns: "2rem 3rem 5rem 4.5rem 5.5rem 5rem 5rem 5rem", gap: "12px", padding: "9px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV, alignItems: "center", fontVariantNumeric: "tabular-nums" }}>
            <div style={{ fontWeight: 900, fontSize: "14px", color: c.textPrimary, letterSpacing: "-0.02em" }}>{h.h}</div>
            <div style={{ fontSize: "9px", color: c.textMuted }}>{h.date}</div>
            <div style={{ fontWeight: 700, fontSize: "10px", color: h.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h.dir}</div>
            <div style={{ textAlign: "right", fontWeight: 700, fontSize: "13px", color: h.color }}>{h.conf.toFixed(1)}%</div>
            <div style={{ textAlign: "right", fontWeight: 700, fontSize: "13px", color: h.ret > 0 ? c.accentCyan : c.accentRed }}>{formatPct(h.ret)}</div>
            <div style={{ textAlign: "right", fontSize: "11px", color: c.textSecondary }}>₹{formatPrice(dive.current_price)}</div>
            <div style={{ textAlign: "right", fontSize: "11px", color: c.accentCyan }}>₹{formatPrice(h.tgt)}</div>
            <div style={{ textAlign: "right", fontSize: "11px", color: c.accentRed }}>₹{formatPrice(h.sl)}</div>
          </div>
        ))}
      </div>

      {/* ═══ INDICATORS + S/R + PEERS ═══ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "48px",
        }}
      >
        {/* Indicators */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, borderBottom: `2px solid ${c.textPrimary}`, paddingBottom: "5px", marginBottom: "0" }}>
            Indicators
          </div>
          {Object.entries(dive.key_indicators).filter(([, v]) => v !== null).slice(0, 10).map(([key, val]) => {
            const v = val as number;
            const rsiC = key.includes("rsi") ? (v > 70 ? c.accentRed : v < 30 ? c.accentCyan : c.textPrimary) : c.textPrimary;
            return (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                <div style={{ fontSize: "11px", color: c.textSecondary }}>{key.replace(/_/g, " ")}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: rsiC, fontVariantNumeric: "tabular-nums" }}>{v.toFixed(2)}</div>
              </div>
            );
          })}
        </div>

        {/* S/R */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, borderBottom: `2px solid ${c.accentRed}`, paddingBottom: "5px", marginBottom: "0" }}>
            Support / Resistance
          </div>
          {((dive.support_resistance?.resistance as number[]) ?? []).slice(0, 3).map((r, i) => (
            <div key={`r${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
              <div style={{ fontSize: "11px", color: c.accentRed, fontWeight: 700, letterSpacing: "0.05em" }}>R{i + 1}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: c.accentRed, fontVariantNumeric: "tabular-nums" }}>₹{formatPrice(r)}</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${c.textPrimary}`, borderBottom: `1px solid ${c.textPrimary}`, fontFamily: HV }}>
            <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: c.textPrimary }}>Now</div>
            <div style={{ fontSize: "13px", fontWeight: 900, fontVariantNumeric: "tabular-nums", color: c.textPrimary }}>₹{formatPrice(dive.current_price)}</div>
          </div>
          {((dive.support_resistance?.support as number[]) ?? []).slice(0, 3).map((s, i) => (
            <div key={`s${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
              <div style={{ fontSize: "11px", color: c.accentCyan, fontWeight: 700, letterSpacing: "0.05em" }}>S{i + 1}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: c.accentCyan, fontVariantNumeric: "tabular-nums" }}>₹{formatPrice(s)}</div>
            </div>
          ))}
        </div>

        {/* Peers */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, borderBottom: `2px solid ${c.accentCyan}`, paddingBottom: "5px", marginBottom: "0" }}>
            Peer Comparison
          </div>
          {Object.entries(dive.peer_comparison).map(([sym, d]) => {
            const pd = d as Record<string, unknown>;
            const pDir = pd.direction as string;
            const pC = pDir === "long" ? c.accentCyan : pDir === "short" ? c.accentRed : c.accentNeutral;
            return (
              <div key={sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: pC }}>{formatTicker(sym)}</div>
                  <div style={{ fontSize: "10px", color: c.textMuted }}>{pDir} · {(pd.confidence as number)?.toFixed(0)}%</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: c.textPrimary }}>₹{formatPrice(pd.price as number)}</div>
                  <div style={{ fontSize: "10px", color: (pd.return_1m as number) > 0 ? c.accentCyan : c.accentRed, fontVariantNumeric: "tabular-nums" }}>{formatPct(pd.return_1m as number)} 1M</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* News */}
      {dive.news_catalysts && dive.news_catalysts.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <div style={{ height: "2px", background: c.textPrimary, marginBottom: "24px" }} />
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, marginBottom: "16px" }}>
            News Catalysts
          </div>
          {dive.news_catalysts.map((n, i) => {
            const s = n.sentiment as number;
            const sc = s > 0.3 ? c.accentCyan : s < -0.1 ? c.accentRed : c.accentNeutral;
            return (
              <div key={i} style={{ display: "flex", gap: "16px", padding: "12px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                <div style={{ width: "80px", flexShrink: 0, fontSize: "10px", color: c.textMuted, fontVariantNumeric: "tabular-nums" }}>
                  {formatDate(n.date as string)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", color: c.textPrimary, lineHeight: 1.4, marginBottom: "4px" }}>{n.headline as string}</div>
                  <div style={{ fontSize: "10px", color: sc, fontWeight: 700, letterSpacing: "0.05em" }}>
                    {s > 0.3 ? "POSITIVE" : s < -0.1 ? "NEGATIVE" : "NEUTRAL"} ({s.toFixed(2)})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
