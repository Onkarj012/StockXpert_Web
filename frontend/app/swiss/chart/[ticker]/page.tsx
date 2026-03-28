"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStockDeepDive } from "@/lib/api/hooks";
import { COMPANY_NAMES, SECTOR_MAP } from "@/lib/utils/trading";
import { formatTicker, formatPrice } from "@/lib/utils/format";
import { useSwissTheme } from "@/lib/utils/ThemeContext";
import TradingChart from "@/components/shared/TradingChart";
import type { ChartPoint } from "@/types/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function ChartFillWrapper({
  data,
  isDark,
  indicators,
  showRSI,
  showMACD,
}: {
  data: ChartPoint[];
  isDark: boolean;
  indicators: string[];
  showRSI: boolean;
  showMACD: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(600);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setH(el.clientHeight));
    obs.observe(el);
    setH(el.clientHeight);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      <TradingChart
        data={data}
        isDark={isDark}
        indicators={indicators}
        showVolume
        showRSI={showRSI}
        showMACD={showMACD}
        height={h || 600}
      />
    </div>
  );
}

const HV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

type Timeframe = "1M" | "3M" | "6M" | "1Y";

const TIMEFRAMES: { label: string; value: Timeframe; days: number }[] = [
  { label: "1M", value: "1M", days: 30 },
  { label: "3M", value: "3M", days: 90 },
  { label: "6M", value: "6M", days: 180 },
  { label: "1Y", value: "1Y", days: 365 },
];

const OVERLAYS = [
  { id: "sma20", label: "SMA 20" },
  { id: "sma50", label: "SMA 50" },
  { id: "bollinger", label: "BB" },
  { id: "vwap", label: "VWAP" },
];

const PANELS = [
  { id: "rsi", label: "RSI" },
  { id: "macd", label: "MACD" },
];

export default function ChartTerminalPage() {
  const params = useParams();
  const ticker = params.ticker as string;
  const c = useSwissTheme();
  const isDark = c.isDark;

  const [timeframe, setTimeframe] = useState<Timeframe>("3M");
  const [activeOverlays, setActiveOverlays] = useState<string[]>(["sma20"]);
  const [activePanels, setActivePanels] = useState<string[]>([]);

  const days = TIMEFRAMES.find((t) => t.value === timeframe)?.days ?? 90;
  const { data: dive, loading } = useStockDeepDive(ticker, days);

  const toggleOverlay = (id: string) =>
    setActiveOverlays((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const togglePanel = (id: string) =>
    setActivePanels((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const showRSI = activePanels.includes("rsi");
  const showMACD = activePanels.includes("macd");

  const primaryPred =
    dive?.predictions["1"] ??
    dive?.predictions["1d"] ??
    Object.values(dive?.predictions ?? {})[0];

  const isBull = primaryPred?.direction === "long";
  const dirColor = isBull ? "#00bdf0" : primaryPred?.direction === "short" ? "#e84040" : "#888";

  // Latest OHLC from last candle
  const lastCandle = dive?.chart?.[dive.chart.length - 1];

  // Compute price change from first candle
  const firstClose = dive?.chart?.[0]?.close ?? null;
  const lastClose = lastCandle?.close ?? null;
  const priceChange = firstClose && lastClose ? lastClose - firstClose : null;
  const pricePct = firstClose && priceChange != null ? (priceChange / firstClose) * 100 : null;

  const bg = isDark ? "#131722" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "#e8e8e8";
  const text = isDark ? "#d1d4dc" : "#131722";
  const muted = isDark ? "#60606a" : "#999";
  const toolbarBg = isDark ? "#1e222d" : "#f8f8f8";

  const panelCount = activePanels.length;
  const panelH = panelCount * 120;
  const mainChartH = `calc(100vh - 96px - ${panelH}px)`;

  return (
    // Full-screen overlay that escapes the swiss layout container
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: bg,
        fontFamily: HV,
        display: "flex",
        flexDirection: "column",
        zIndex: 200,
      }}
    >
      {/* ── TOP BAR ── */}
      <div
        style={{
          height: "48px",
          borderBottom: `1px solid ${border}`,
          background: toolbarBg,
          display: "flex",
          alignItems: "center",
          gap: "0",
          flexShrink: 0,
        }}
      >
        {/* Back */}
        <Link
          href={`/swiss/stocks/${ticker}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "0 16px",
            height: "100%",
            borderRight: `1px solid ${border}`,
            color: muted,
            textDecoration: "none",
            fontSize: "12px",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={14} />
        </Link>

        {/* Ticker identity */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            padding: "0 20px",
            borderRight: `1px solid ${border}`,
            height: "100%",
            alignSelf: "stretch",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 900,
              color: dirColor,
              letterSpacing: "-0.02em",
              lineHeight: "48px",
            }}
          >
            {formatTicker(ticker)}
          </span>
          <span style={{ fontSize: "11px", color: muted, lineHeight: "48px" }}>
            {COMPANY_NAMES[ticker]?.split(" ").slice(0, 3).join(" ")}
          </span>
        </div>

        {/* OHLC strip */}
        {lastCandle && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "0 20px",
              borderRight: `1px solid ${border}`,
              height: "100%",
            }}
          >
            {[
              { l: "O", v: lastCandle.open },
              { l: "H", v: lastCandle.high },
              { l: "L", v: lastCandle.low },
              { l: "C", v: lastCandle.close },
            ].map(({ l, v }) => (
              <span key={l} style={{ fontSize: "11px", color: muted }}>
                <span style={{ marginRight: "3px" }}>{l}</span>
                <span style={{ color: text, fontVariantNumeric: "tabular-nums" }}>
                  {v?.toFixed(2)}
                </span>
              </span>
            ))}
            {priceChange != null && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: priceChange >= 0 ? "#26a69a" : "#ef5350",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {priceChange >= 0 ? "+" : ""}
                {priceChange.toFixed(2)} ({pricePct?.toFixed(2)}%)
              </span>
            )}
          </div>
        )}

        {/* AI Signal badge */}
        {primaryPred && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 20px",
              borderRight: `1px solid ${border}`,
              height: "100%",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: muted,
              }}
            >
              AI Signal
            </div>
            <div
              style={{
                padding: "3px 8px",
                background: dirColor,
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {primaryPred.direction}
            </div>
            <div style={{ fontSize: "11px", color: dirColor, fontWeight: 700 }}>
              {primaryPred.confidence_pct?.toFixed(0)}%
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Overlay toggles */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "0 12px",
            borderLeft: `1px solid ${border}`,
            height: "100%",
          }}
        >
          {OVERLAYS.map((o) => {
            const on = activeOverlays.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggleOverlay(o.id)}
                style={{
                  padding: "3px 8px",
                  fontSize: "10px",
                  fontFamily: HV,
                  fontWeight: on ? 700 : 400,
                  background: on ? (isDark ? "rgba(255,255,255,0.12)" : "#000") : "transparent",
                  color: on ? (isDark ? "#fff" : "#fff") : muted,
                  border: `1px solid ${on ? (isDark ? "rgba(255,255,255,0.2)" : "#000") : border}`,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        {/* Panel toggles */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "0 12px",
            borderLeft: `1px solid ${border}`,
            height: "100%",
          }}
        >
          {PANELS.map((p) => {
            const on = activePanels.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePanel(p.id)}
                style={{
                  padding: "3px 8px",
                  fontSize: "10px",
                  fontFamily: HV,
                  fontWeight: on ? 700 : 400,
                  background: on ? "#e84040" : "transparent",
                  color: on ? "#fff" : muted,
                  border: `1px solid ${on ? "#e84040" : border}`,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Timeframe */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            padding: "0 12px",
            borderLeft: `1px solid ${border}`,
            height: "100%",
          }}
        >
          {TIMEFRAMES.map((tf) => {
            const on = timeframe === tf.value;
            return (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                style={{
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontFamily: HV,
                  fontWeight: on ? 700 : 400,
                  background: on ? (isDark ? "#fff" : "#131722") : "transparent",
                  color: on ? (isDark ? "#131722" : "#fff") : muted,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {tf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CHART AREA ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {loading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: `2px solid ${border}`,
                borderTopColor: isDark ? "#fff" : "#000",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span style={{ fontSize: "12px", color: muted }}>Loading {formatTicker(ticker)}...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : dive?.chart && dive.chart.length > 0 ? (
          <div style={{ width: "100%", height: "100%" }}>
            <ChartFillWrapper
              data={dive.chart}
              isDark={isDark}
              indicators={activeOverlays}
              showRSI={showRSI}
              showMACD={showMACD}
            />
          </div>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "14px", color: muted }}>No chart data</span>
          </div>
        )}

        {/* ── Target / Stop overlay (bottom-right) ── */}
        {primaryPred && dive && (
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              right: "80px",
              background: isDark ? "rgba(19,23,34,0.9)" : "rgba(255,255,255,0.92)",
              border: `1px solid ${border}`,
              padding: "12px 16px",
              backdropFilter: "blur(8px)",
              display: "flex",
              gap: "24px",
              alignItems: "center",
            }}
          >
            {[
              { l: "Entry", v: `₹${formatPrice(dive.current_price)}`, c: text },
              { l: "Target", v: `₹${formatPrice(primaryPred.target_price)}`, c: "#26a69a" },
              { l: "Stop Loss", v: `₹${formatPrice(primaryPred.stop_loss)}`, c: "#ef5350" },
              {
                l: "R/R",
                v: primaryPred.risk_reward_ratio
                  ? `${(primaryPred.risk_reward_ratio as number).toFixed(2)}×`
                  : "—",
                c: dirColor,
              },
            ].map(({ l, v, c: col }) => (
              <div key={l}>
                <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: "3px" }}>
                  {l}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: col, fontVariantNumeric: "tabular-nums" }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
