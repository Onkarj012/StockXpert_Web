"use client";

import { useState } from "react";
import { useStockDeepDive } from "@/lib/api/hooks";
import {
  NSE_SYMBOLS,
  COMPANY_NAMES,
  SECTOR_MAP,
  getNextTradingDays,
  formatTradingDate,
} from "@/lib/utils/trading";
import {
  formatTicker,
  formatPrice,
  formatPct,
  formatDateTime,
} from "@/lib/utils/format";
import OHLCVChart, { OverlayToggle } from "@/components/shared/OHLCVChart";
import { useEditorialTheme } from "@/lib/utils/ThemeContext";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronDown,
  AlertCircle,
  Info,
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

function offsetToLookback(offset: number): number {
  if (offset <= 0) return Math.min(90, Math.max(30, -offset + 30));
  return 60;
}

export default function EditorialPredict() {
  const [selectedTicker, setSelectedTicker] = useState("RELIANCE.NS");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d;
  });
  const [lookback, setLookback] = useState(60);
  const [overlays, setOverlays] = useState({ sma20: true, sma50: false, bollingerBands: false, vwap: false });
  const toggleOv = (k: keyof typeof overlays) => setOverlays((p) => ({ ...p, [k]: !p[k] }));
  const c = useEditorialTheme();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selD = new Date(selectedDate); selD.setHours(0, 0, 0, 0);
  const dayOffset = Math.round((selD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isFuture = dayOffset > 0;
  const horizonDays = isFuture ? Math.max(1, Math.min(10, dayOffset)) : 1;

  const { data: dive, loading } = useStockDeepDive(selectedTicker, lookback);

  const predictions = dive?.predictions ?? {};
  const horizonKey = String(horizonDays);
  const relevantPred = predictions[horizonKey] ?? predictions[`${horizonDays}d`] ?? Object.values(predictions)[0];

  const nextTradingDays = getNextTradingDays(10);
  const minDate = new Date(today); minDate.setDate(today.getDate() - 60);
  const maxDate = nextTradingDays[9];

  const company = COMPANY_NAMES[selectedTicker] ?? selectedTicker;
  const sector = SECTOR_MAP[selectedTicker];
  const isBull = relevantPred?.direction === "long";
  const accentColor = isBull ? c.accentBull : relevantPred?.direction === "short" ? c.accentBear : c.accentNeutral;

  const allHorizons = dive
    ? [1, 3, 5, 7, 10].map((h) => {
        const p = predictions[String(h)] ?? predictions[`${h}d`] ?? Object.values(predictions)[0];
        return {
          h: `${h}D`,
          conf: p?.confidence_pct ?? 0,
          ret: p?.expected_return_pct ?? 0,
          dir: p?.direction ?? "neutral",
          color: p?.direction === "long" ? c.accentBull : p?.direction === "short" ? c.accentBear : c.accentNeutral,
        };
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ fontFamily: '"Georgia", serif', fontSize: "11px", color: c.accentGold, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "8px" }}>
          AI Price Intelligence
        </div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: "56px", fontWeight: 900, color: c.textPrimary, letterSpacing: "-0.03em", lineHeight: 0.9 }}>
          Predict
        </h1>
        <p style={{ fontFamily: '"Georgia", serif', fontSize: "15px", color: c.textSecondary, marginTop: "12px", maxWidth: "480px", lineHeight: 1.55 }}>
          Select a stock and a target date to view AI-generated price predictions, confidence levels, and multi-horizon forecasts.
        </p>
      </div>

      <div style={{ height: "3px", background: `linear-gradient(to right, ${c.accentBear}, ${c.accentGold})`, marginBottom: "40px", maxWidth: "200px" }} />

      {/* Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "32px", marginBottom: "40px", padding: "24px", background: c.bgSecondary, border: `1px solid ${c.borderSubtle}` }}>
        {/* Stock Picker */}
        <div>
          <div style={{ fontFamily: '"Georgia", serif', fontSize: "10px", color: c.textMuted, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>
            Select Stock
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              style={{
                width: "100%", fontFamily: '"Playfair Display", serif', fontSize: "16px", fontWeight: 700,
                color: c.accentBear, background: c.bgCard,
                border: `1px solid ${c.borderSubtle}`, borderTop: `3px solid ${c.accentBear}`,
                padding: "10px 36px 10px 14px", cursor: "pointer", outline: "none", appearance: "none",
              }}
            >
              {NSE_SYMBOLS.map((sym) => (
                <option key={sym} value={sym}>{sym.replace(".NS", "")} — {COMPANY_NAMES[sym] ?? sym}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: c.accentBear }} />
          </div>
          {sector && <div style={{ fontFamily: '"Georgia", serif', fontSize: "11px", color: c.textMuted, marginTop: "6px" }}>{sector} · NSE</div>}
        </div>

        {/* Date Picker */}
        <div>
          <div style={{ fontFamily: '"Georgia", serif', fontSize: "10px", color: c.textMuted, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>
            Target Date
          </div>
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            min={minDate.toISOString().split("T")[0]}
            max={maxDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            style={{
              fontFamily: '"Playfair Display", serif', fontSize: "15px", color: c.textPrimary,
              background: c.bgCard, border: `1px solid ${c.borderSubtle}`, borderTop: `3px solid ${c.accentGold}`,
              padding: "10px 14px", width: "100%", cursor: "pointer", outline: "none",
            }}
          />
          <div style={{ fontFamily: '"Georgia", serif', fontSize: "11px", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", color: isFuture ? c.accentBear : c.textMuted }}>
            <Clock size={11} />
            {isFuture ? `${horizonDays}-day ahead forecast` : dayOffset === 0 ? "Today — current signals" : `${Math.abs(dayOffset)}-day historical context`}
          </div>
          <div style={{ display: "flex", gap: "4px", marginTop: "8px", flexWrap: "wrap" }}>
            {[
              { label: "Tomorrow", date: nextTradingDays[0] },
              { label: "3D", date: nextTradingDays[2] },
              { label: "5D", date: nextTradingDays[4] },
              { label: "1W", date: nextTradingDays[4] },
              { label: "2W", date: nextTradingDays[9] },
            ].map(({ label, date }) => (
              <button key={label} onClick={() => setSelectedDate(date)} style={{ fontFamily: '"Georgia", serif', fontSize: "10px", padding: "3px 8px", background: "transparent", border: `1px solid ${c.borderSecondary}`, color: c.accentBear, cursor: "pointer", letterSpacing: "0.05em" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lookback */}
        <div>
          <div style={{ fontFamily: '"Georgia", serif', fontSize: "10px", color: c.textMuted, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>
            Historical Context
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[30, 60, 90].map((l) => (
              <button
                key={l}
                onClick={() => setLookback(l)}
                style={{
                  fontFamily: '"Playfair Display", serif', fontSize: "14px", fontWeight: lookback === l ? 700 : 400,
                  padding: "8px 14px",
                  background: lookback === l ? c.accentBear : "transparent",
                  border: `1px solid ${lookback === l ? c.accentBear : c.borderSecondary}`,
                  color: lookback === l ? "#fff" : c.textSecondary,
                  cursor: "pointer",
                }}
              >
                {l}D
              </button>
            ))}
          </div>
          <p style={{ fontFamily: '"Georgia", serif', fontSize: "11px", color: c.textMuted, marginTop: "8px", lineHeight: 1.4 }}>
            Days of OHLCV data used for model context.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      {isFuture ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: `${c.accentBear}10`, border: `1px solid ${c.accentBear}30`, marginBottom: "32px" }}>
          <Info size={14} color={c.accentBear} />
          <span style={{ fontFamily: '"Georgia", serif', fontSize: "13px", color: c.accentBear }}>
            Showing {horizonDays}-day ahead AI forecast for <strong>{formatTicker(selectedTicker)}</strong>. Target date: <strong>{formatTradingDate(selectedDate)}</strong>
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: `${c.accentGold}10`, border: `1px solid ${c.accentGold}30`, marginBottom: "32px" }}>
          <AlertCircle size={14} color={c.accentGold} />
          <span style={{ fontFamily: '"Georgia", serif', fontSize: "13px", color: c.textSecondary }}>
            Showing current model signals with {lookback}-day historical context. Select a future date for forward-looking forecasts.
          </span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", fontFamily: '"Georgia", serif', fontStyle: "italic", color: c.textMuted }}>
          Loading predictions for {formatTicker(selectedTicker)}…
        </div>
      ) : dive ? (
        <>
          {/* Hero Prediction */}
          <section style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "60px", marginBottom: "40px", paddingBottom: "40px", borderBottom: `1px solid ${c.borderSubtle}` }}>
            <div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 12px", background: accentColor, fontFamily: '"Georgia", serif', fontSize: "11px", color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  {isBull ? <TrendingUp size={12} style={{ marginRight: "4px" }} /> : <TrendingDown size={12} style={{ marginRight: "4px" }} />}
                  {relevantPred?.direction?.toUpperCase() ?? "NEUTRAL"}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", border: `1px solid ${c.borderSecondary}`, fontFamily: '"Georgia", serif', fontSize: "11px", color: c.textMuted }}>
                  <Clock size={11} style={{ marginRight: "4px" }} /> {formatTradingDate(selectedDate)}
                </div>
              </div>

              <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: "clamp(44px, 5vw, 64px)", fontWeight: 900, color: accentColor, letterSpacing: "-0.03em", lineHeight: 0.9, marginBottom: "8px" }}>
                {formatTicker(selectedTicker)}
              </h2>
              <div style={{ fontFamily: '"Georgia", serif', fontSize: "18px", color: c.textSecondary, marginBottom: "8px" }}>
                {company}
              </div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: "36px", fontWeight: 900, color: c.textPrimary }}>
                ₹{formatPrice(dive.current_price)}
              </div>
              <div style={{ fontFamily: '"Georgia", serif', fontSize: "12px", color: c.textMuted, marginTop: "4px" }}>
                Current price · Last updated {formatDateTime(dive.generated_at)}
              </div>
            </div>

            {relevantPred && (
              <div style={{ borderTop: `4px solid ${accentColor}`, paddingTop: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { label: "Confidence", value: `${(relevantPred.confidence_pct as number)?.toFixed(1)}%`, col: accentColor },
                    { label: "Expected Return", value: formatPct(relevantPred.expected_return_pct as number), col: isBull ? c.accentBull : c.accentBear },
                    { label: "Entry Price", value: `₹${formatPrice(relevantPred.entry_price as number)}` },
                    { label: "Target Price", value: `₹${formatPrice(relevantPred.target_price as number)}`, col: c.accentBull },
                    { label: "Stop Loss", value: `₹${formatPrice(relevantPred.stop_loss as number)}`, col: c.accentBear },
                    { label: "Horizon", value: isFuture ? `${horizonDays} days` : "1 day", col: c.accentGold },
                  ].map(({ label, value, col }) => (
                    <div key={label} style={{ paddingBottom: "14px", borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <div style={{ fontFamily: '"Georgia", serif', fontSize: "9px", color: c.textMuted, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>
                        {label}
                      </div>
                      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: "16px", fontWeight: 700, color: col ?? c.textPrimary }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* All Horizons */}
          {allHorizons.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: "28px", fontWeight: 900, color: c.textPrimary, marginBottom: "24px" }}>
                All Horizon Predictions
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {allHorizons.map((h) => {
                  const targetD = nextTradingDays[h.h === "1D" ? 0 : h.h === "3D" ? 2 : h.h === "5D" ? 4 : h.h === "7D" ? 6 : 9];
                  return (
                    <div
                      key={h.h}
                      style={{ borderTop: `3px solid ${h.color}`, padding: "14px", background: c.bgCard, cursor: "pointer" }}
                      onClick={() => targetD && setSelectedDate(targetD)}
                    >
                      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: "26px", fontWeight: 900, color: h.color, letterSpacing: "-0.02em", lineHeight: 1 }}>
                        {h.h}
                      </div>
                      <div style={{ fontFamily: '"Georgia", serif', fontSize: "10px", color: c.textMuted, marginTop: "4px" }}>
                        {targetD ? formatTradingDate(targetD) : "—"}
                      </div>
                      <div style={{ height: "1px", background: c.accentGold, margin: "10px 0", width: "20px" }} />
                      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: "20px", fontWeight: 900, color: h.color }}>
                        {h.conf.toFixed(0)}%
                      </div>
                      <div style={{ fontFamily: '"Georgia", serif', fontSize: "9px", color: c.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        confidence
                      </div>
                      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: "16px", fontWeight: 700, color: h.color, marginTop: "8px" }}>
                        {formatPct(h.ret)}
                      </div>
                      <div style={{ fontFamily: '"Georgia", serif', fontSize: "9px", color: c.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        expected
                      </div>
                      <div style={{ fontFamily: '"Georgia", serif', fontSize: "10px", color: h.color, marginTop: "6px", textTransform: "uppercase" }}>
                        {h.dir}
                      </div>
                    </div>
                  );
                })}
              </div>

              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={allHorizons} barSize={40}>
                  <XAxis dataKey="h" tick={{ fontSize: 11, fontFamily: '"Georgia", serif', fill: c.textSecondary }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 10, fontFamily: '"Georgia", serif', fill: c.textMuted }} axisLine={false} tickLine={false} width={30} unit="%" />
                  <Tooltip contentStyle={{ fontFamily: '"Georgia", serif', fontSize: "11px", border: `1px solid ${c.accentGold}`, background: c.tooltipBg, color: c.tooltipText }} formatter={(v) => [`${v}%`, "Confidence"]} />
                  <Bar dataKey="conf" radius={[2, 2, 0, 0]}>
                    {allHorizons.map((h, i) => <Cell key={i} fill={h.color} fillOpacity={0.7} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* OHLCV Chart */}
          <section style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: "28px", fontWeight: 900, color: c.textPrimary }}>
                Historical Price Chart ({lookback}D)
              </h2>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["sma20", "sma50", "bollingerBands", "vwap"] as const).map((k) => (
                  <OverlayToggle key={k} label={{ sma20: "SMA 20", sma50: "SMA 50", bollingerBands: "BB", vwap: "VWAP" }[k]} active={overlays[k]} color={c.accentBear} onClick={() => toggleOv(k)} style="editorial" />
                ))}
              </div>
            </div>
            <OHLCVChart data={dive.chart} theme="editorial" height={380} overlays={overlays} showVolume />
          </section>

          {/* Support/Resistance + Indicators */}
          <section>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
              <div>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: "22px", fontWeight: 900, color: c.textPrimary, marginBottom: "16px" }}>
                  Support &amp; Resistance
                </h3>
                {((dive.support_resistance?.resistance as number[]) ?? []).slice(0, 3).map((r, i) => (
                  <div key={`r${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: '"Playfair Display", serif' }}>
                    <span style={{ color: c.accentBear, fontStyle: "italic", fontSize: "13px" }}>Resistance {i + 1}</span>
                    <span style={{ fontWeight: 700, color: c.accentBear }}>₹{formatPrice(r)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `2px solid ${c.textPrimary}`, fontFamily: '"Playfair Display", serif' }}>
                  <span style={{ fontWeight: 900, fontSize: "14px", color: c.textPrimary }}>Current</span>
                  <span style={{ fontWeight: 900, fontSize: "16px", color: c.textPrimary }}>₹{formatPrice(dive.current_price)}</span>
                </div>
                {((dive.support_resistance?.support as number[]) ?? []).slice(0, 3).map((s, i) => (
                  <div key={`s${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: '"Playfair Display", serif' }}>
                    <span style={{ color: c.accentBull, fontStyle: "italic", fontSize: "13px" }}>Support {i + 1}</span>
                    <span style={{ fontWeight: 700, color: c.accentBull }}>₹{formatPrice(s)}</span>
                  </div>
                ))}
              </div>

              <div>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: "22px", fontWeight: 900, color: c.textPrimary, marginBottom: "16px" }}>
                  Key Indicators
                </h3>
                {Object.entries(dive.key_indicators).filter(([, v]) => v !== null).slice(0, 8).map(([key, val]) => {
                  const v = val as number;
                  const rsiC = key.includes("rsi") ? (v > 70 ? c.accentBear : v < 30 ? c.accentBull : c.textSecondary) : c.textPrimary;
                  return (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: '"Georgia", serif' }}>
                      <span style={{ fontSize: "13px", color: c.textSecondary }}>
                        {key.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                      </span>
                      <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: rsiC }}>{v.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
