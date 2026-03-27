"use client";

import { useState } from "react";
import { useStockDeepDive } from "@/lib/api/hooks";
import {
  NSE_SYMBOLS, COMPANY_NAMES, SECTOR_MAP,
  getNextTradingDays, formatTradingDate,
} from "@/lib/utils/trading";
import {
  formatTicker, formatPrice, formatPct, formatDateTime,
} from "@/lib/utils/format";
import OHLCVChart, { OverlayToggle } from "@/components/shared/OHLCVChart";
import { useSwissTheme } from "@/lib/utils/ThemeContext";
import { Clock, ChevronDown, AlertCircle, Info } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid,
} from "recharts";

const HV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function SwissPredict() {
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
  const c = useSwissTheme();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selD = new Date(selectedDate); selD.setHours(0, 0, 0, 0);
  const dayOffset = Math.round((selD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isFuture = dayOffset > 0;
  const horizonDays = isFuture ? Math.max(1, Math.min(10, dayOffset)) : 1;

  const { data: dive, loading } = useStockDeepDive(selectedTicker, lookback);

  const predictions = dive?.predictions ?? {};
  const relevantPred = predictions[String(horizonDays)] ?? predictions[`${horizonDays}d`] ?? Object.values(predictions)[0];

  const nextTradingDays = getNextTradingDays(10);
  const minDate = new Date(today); minDate.setDate(today.getDate() - 60);
  const maxDate = nextTradingDays[9];

  const isBull = relevantPred?.direction === "long";
  const dirColor = isBull ? c.accentCyan : relevantPred?.direction === "short" ? c.accentRed : c.accentNeutral;

  const allHorizons = dive
    ? [1, 3, 5, 7, 10].map((h) => {
        const p = predictions[String(h)] ?? predictions[`${h}d`] ?? Object.values(predictions)[0];
        return {
          h: `${h}D`,
          conf: p?.confidence_pct ?? 0,
          ret: p?.expected_return_pct ?? 0,
          dir: p?.direction ?? "neutral",
          color: p?.direction === "long" ? c.accentCyan : p?.direction === "short" ? c.accentRed : c.accentNeutral,
        };
      })
    : [];

  return (
    <div className="py-12">
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: c.textSecondary, marginBottom: "8px" }}>
          Signal Intelligence
        </div>
        <h1 style={{ fontFamily: HV, fontSize: "52px", fontWeight: 900, color: c.textPrimary, letterSpacing: "-0.04em", lineHeight: 0.9 }}>
          Predict
        </h1>
      </div>

      <div style={{ height: "2px", background: c.textPrimary, marginBottom: "24px" }} />

      {/* Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "24px", padding: "20px", background: c.bgSecondary, border: `1px solid ${c.borderSubtle}` }}>
        {/* Stock */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "6px" }}>Stock</div>
          <div style={{ position: "relative" }}>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              style={{ width: "100%", fontFamily: HV, fontSize: "14px", fontWeight: 700, color: c.accentRed, background: c.bgInput, border: `1px solid ${c.borderSecondary}`, borderTop: `2px solid ${c.textPrimary}`, padding: "8px 30px 8px 10px", cursor: "pointer", outline: "none", appearance: "none" }}
            >
              {NSE_SYMBOLS.map((sym) => (
                <option key={sym} value={sym}>{sym.replace(".NS", "")} — {COMPANY_NAMES[sym] ?? sym}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: c.textPrimary }} />
          </div>
          {SECTOR_MAP[selectedTicker] && (
            <div style={{ fontFamily: HV, fontSize: "10px", color: c.textMuted, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {SECTOR_MAP[selectedTicker]}
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "6px" }}>Target Date</div>
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            min={minDate.toISOString().split("T")[0]}
            max={maxDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            style={{ fontFamily: HV, fontSize: "13px", color: c.textPrimary, background: c.bgInput, border: `1px solid ${c.borderSecondary}`, borderTop: `2px solid ${c.accentRed}`, padding: "8px 10px", width: "100%", cursor: "pointer", outline: "none" }}
          />
          <div style={{ fontFamily: HV, fontSize: "10px", marginTop: "5px", display: "flex", alignItems: "center", gap: "3px", color: isFuture ? c.accentRed : c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <Clock size={10} />
            {isFuture ? `${horizonDays}D AHEAD` : dayOffset === 0 ? "TODAY" : `${Math.abs(dayOffset)}D AGO`}
          </div>
          <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
            {[
              { label: "+1", date: nextTradingDays[0] },
              { label: "+3", date: nextTradingDays[2] },
              { label: "+5", date: nextTradingDays[4] },
              { label: "+7", date: nextTradingDays[6] },
              { label: "+10", date: nextTradingDays[9] },
            ].map(({ label, date }) => (
              <button key={label} onClick={() => setSelectedDate(date)} style={{ fontFamily: HV, fontSize: "9px", padding: "2px 6px", background: "transparent", border: `1px solid ${c.borderSecondary}`, color: c.accentRed, cursor: "pointer", letterSpacing: "0.05em", fontWeight: 700 }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lookback */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "6px" }}>Data window</div>
          <div style={{ display: "flex", gap: "3px" }}>
            {[30, 60, 90].map((l) => (
              <button key={l} onClick={() => setLookback(l)} style={{ fontFamily: HV, fontSize: "11px", fontWeight: lookback === l ? 700 : 400, padding: "6px 10px", background: lookback === l ? c.textPrimary : "transparent", border: `1px solid ${lookback === l ? c.textPrimary : c.borderSecondary}`, color: lookback === l ? c.bgPrimary : c.textSecondary, cursor: "pointer", letterSpacing: "0.05em" }}>
                {l}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: isFuture ? `${c.accentRed}10` : c.bgSecondary, border: `1px solid ${isFuture ? c.accentRed + "30" : c.borderSubtle}`, marginBottom: "24px", fontFamily: HV }}>
        {isFuture ? <Info size={13} color={c.accentRed} /> : <AlertCircle size={13} color={c.textMuted} />}
        <span style={{ fontSize: "12px", color: isFuture ? c.accentRed : c.textSecondary }}>
          {isFuture
            ? `${horizonDays}-day forward prediction for ${formatTicker(selectedTicker)} — target: ${formatTradingDate(selectedDate)}`
            : `Current model output for ${formatTicker(selectedTicker)} · Use future dates for forecast signals`}
        </span>
      </div>

      {loading ? (
        <div style={{ fontFamily: HV, fontSize: "13px", color: c.textMuted, padding: "40px 0" }}>Loading signals…</div>
      ) : dive ? (
        <>
          {/* Hero row */}
          <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: "48px", marginBottom: "32px" }}>
            <div>
              <div style={{ fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: c.textMuted, marginBottom: "8px" }}>
                {SECTOR_MAP[selectedTicker] ?? "NSE"} · {relevantPred?.direction?.toUpperCase() ?? "NEUTRAL"}
              </div>
              <h2 style={{ fontFamily: HV, fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 900, color: dirColor, letterSpacing: "-0.05em", lineHeight: 0.85, marginBottom: "6px" }}>
                {formatTicker(selectedTicker)}
              </h2>
              <div style={{ fontFamily: HV, fontSize: "13px", color: c.textSecondary }}>
                {COMPANY_NAMES[selectedTicker] ?? selectedTicker}
              </div>
              <div style={{ height: "2px", background: dirColor, width: "60px", marginTop: "12px" }} />
            </div>

            <div>
              <div style={{ fontFamily: HV, fontSize: "48px", fontWeight: 900, color: c.textPrimary, letterSpacing: "-0.04em", lineHeight: 1 }}>
                ₹{formatPrice(dive.current_price)}
              </div>
              <div style={{ fontFamily: HV, fontSize: "11px", color: c.textMuted, marginTop: "4px", marginBottom: "12px" }}>
                {formatDateTime(dive.generated_at)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {relevantPred && [
                  { l: "Confidence", v: `${(relevantPred.confidence_pct as number)?.toFixed(1)}%`, col: dirColor },
                  { l: "Exp. Return", v: formatPct(relevantPred.expected_return_pct as number), col: isBull ? c.accentCyan : c.accentRed },
                  { l: "Risk/Reward", v: relevantPred.risk_reward_ratio ? `${(relevantPred.risk_reward_ratio as number).toFixed(2)}×` : "—" },
                  { l: "Entry", v: `₹${formatPrice(relevantPred.entry_price as number)}` },
                  { l: "Target", v: `₹${formatPrice(relevantPred.target_price as number)}`, col: c.accentCyan },
                  { l: "Stop", v: `₹${formatPrice(relevantPred.stop_loss as number)}`, col: c.accentRed },
                ].map(({ l, v, col }) => (
                  <div key={l} style={{ borderTop: `2px solid ${col ?? c.textPrimary}`, paddingTop: "6px" }}>
                    <div style={{ fontFamily: HV, fontSize: "9px", color: c.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>{l}</div>
                    <div style={{ fontFamily: HV, fontSize: "14px", fontWeight: 900, color: col ?? c.textPrimary, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: "2px", background: c.textPrimary, marginBottom: "24px" }} />

          {/* Horizon table */}
          {allHorizons.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "12px" }}>All Horizons</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1px", background: c.textPrimary, marginBottom: "16px" }}>
                {allHorizons.map((h) => (
                  <div key={h.h} style={{ background: c.bgCard, padding: "14px", cursor: "pointer" }}
                    onClick={() => { const idx = { "1D": 0, "3D": 2, "5D": 4, "7D": 6, "10D": 9 }[h.h] ?? 0; setSelectedDate(nextTradingDays[idx]); }}>
                    <div style={{ fontFamily: HV, fontSize: "22px", fontWeight: 900, color: h.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{h.h}</div>
                    <div style={{ fontFamily: HV, fontSize: "9px", color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "3px" }}>{h.dir}</div>
                    <div style={{ marginTop: "10px" }}>
                      <div style={{ fontFamily: HV, fontSize: "18px", fontWeight: 900, color: h.color, fontVariantNumeric: "tabular-nums" }}>{h.conf.toFixed(0)}%</div>
                      <div style={{ fontFamily: HV, fontSize: "9px", color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>conf</div>
                    </div>
                    <div style={{ marginTop: "6px" }}>
                      <div style={{ fontFamily: HV, fontSize: "14px", fontWeight: 700, color: h.color, fontVariantNumeric: "tabular-nums" }}>{formatPct(h.ret)}</div>
                      <div style={{ fontFamily: HV, fontSize: "9px", color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>return</div>
                    </div>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={allHorizons} barSize={40}>
                  <CartesianGrid strokeDasharray="2 2" stroke={c.chartGrid} vertical={false} />
                  <XAxis dataKey="h" tick={{ fontSize: 10, fontFamily: HV, fill: c.textSecondary }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 9, fontFamily: HV, fill: c.textMuted }} axisLine={false} tickLine={false} width={25} unit="%" />
                  <Tooltip contentStyle={{ fontFamily: HV, fontSize: "10px", border: `1px solid ${c.textPrimary}`, background: c.tooltipBg, color: c.tooltipText }} formatter={(v) => [`${v}%`, "Confidence"]} />
                  <Bar dataKey="conf" radius={[1, 1, 0, 0]}>
                    {allHorizons.map((h, i) => <Cell key={i} fill={h.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted }}>
              <span>Price Chart</span>
              <div style={{ display: "flex", gap: "3px" }}>
                {(["sma20", "sma50", "bollingerBands", "vwap"] as const).map((k) => (
                  <OverlayToggle key={k} label={{ sma20: "SMA20", sma50: "SMA50", bollingerBands: "BB", vwap: "VWAP" }[k]} active={overlays[k]} color={c.accentRed} onClick={() => toggleOv(k)} style="swiss" />
                ))}
              </div>
            </div>
            <OHLCVChart data={dive.chart} theme="swiss" height={360} overlays={overlays} showVolume />
          </div>

          {/* S/R + Indicators */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
            <div>
              <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, borderBottom: `2px solid ${c.accentRed}`, paddingBottom: "5px", marginBottom: "0" }}>
                Support / Resistance
              </div>
              {((dive.support_resistance?.resistance as number[]) ?? []).slice(0, 3).map((r, i) => (
                <div key={`r${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                  <div style={{ fontSize: "11px", color: c.accentRed, fontWeight: 700 }}>R{i + 1}</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: c.accentRed, fontVariantNumeric: "tabular-nums" }}>₹{formatPrice(r)}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${c.textPrimary}`, borderBottom: `1px solid ${c.textPrimary}`, fontFamily: HV }}>
                <div style={{ fontSize: "11px", fontWeight: 900, color: c.textPrimary }}>Now</div>
                <div style={{ fontSize: "13px", fontWeight: 900, color: c.textPrimary, fontVariantNumeric: "tabular-nums" }}>₹{formatPrice(dive.current_price)}</div>
              </div>
              {((dive.support_resistance?.support as number[]) ?? []).slice(0, 3).map((s, i) => (
                <div key={`s${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                  <div style={{ fontSize: "11px", color: c.accentCyan, fontWeight: 700 }}>S{i + 1}</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: c.accentCyan, fontVariantNumeric: "tabular-nums" }}>₹{formatPrice(s)}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, borderBottom: `2px solid ${c.textPrimary}`, paddingBottom: "5px", marginBottom: "0" }}>
                Technical Indicators
              </div>
              {Object.entries(dive.key_indicators).filter(([, v]) => v !== null).slice(0, 8).map(([key, val]) => {
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
          </div>
        </>
      ) : null}
    </div>
  );
}
