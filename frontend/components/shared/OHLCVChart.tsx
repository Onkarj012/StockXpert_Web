"use client";

import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import type { ChartPoint } from "@/types/api";

export interface ChartTheme {
  candleUp: string;
  candleDown: string;
  gridColor: string;
  textColor: string;
  volumeColor: string;
  axisColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  lineColors: {
    sma20: string;
    sma50: string;
    bbUpper: string;
    bbLower: string;
    vwap: string;
  };
  backgroundColor?: string;
  fontFamily?: string;
}

export const CHART_THEMES: Record<string, ChartTheme> = {
  brutal: {
    candleUp: "#00ff41",
    candleDown: "#ff0040",
    gridColor: "rgba(255,255,255,0.08)",
    textColor: "#888888",
    volumeColor: "rgba(136,136,136,0.3)",
    axisColor: "rgba(255,255,255,0.2)",
    tooltipBg: "#1a1a1a",
    tooltipBorder: "#ffffff",
    tooltipText: "#ffffff",
    lineColors: {
      sma20: "#ff6b35",
      sma50: "#ffffff",
      bbUpper: "#444",
      bbLower: "#444",
      vwap: "#888",
    },
    backgroundColor: "#0a0a0a",
    fontFamily: '"DM Mono", monospace',
  },
  editorial: {
    candleUp: "#004225",
    candleDown: "#722f37",
    gridColor: "rgba(0,0,0,0.06)",
    textColor: "#6b6b68",
    volumeColor: "rgba(107,107,104,0.2)",
    axisColor: "rgba(0,0,0,0.1)",
    tooltipBg: "#ffffff",
    tooltipBorder: "#d4af37",
    tooltipText: "#1a1a18",
    lineColors: {
      sma20: "#722f37",
      sma50: "#d4af37",
      bbUpper: "#bbbbbb",
      bbLower: "#bbbbbb",
      vwap: "#999",
    },
    backgroundColor: "#faf9f6",
    fontFamily: '"Source Serif 4", serif',
  },
  glass: {
    candleUp: "#00d4ff",
    candleDown: "#ff6b6b",
    gridColor: "rgba(255,255,255,0.04)",
    textColor: "rgba(255,255,255,0.4)",
    volumeColor: "rgba(0,212,255,0.15)",
    axisColor: "rgba(255,255,255,0.1)",
    tooltipBg: "rgba(10,10,20,0.9)",
    tooltipBorder: "rgba(0,212,255,0.3)",
    tooltipText: "#e8e8f0",
    lineColors: {
      sma20: "rgba(0,212,255,0.7)",
      sma50: "rgba(196,168,240,0.7)",
      bbUpper: "rgba(255,255,255,0.2)",
      bbLower: "rgba(255,255,255,0.2)",
      vwap: "rgba(255,107,107,0.5)",
    },
    backgroundColor: "transparent",
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },
  swiss: {
    candleUp: "#00a9e0",
    candleDown: "#da291c",
    gridColor: "#e8e8e8",
    textColor: "#666666",
    volumeColor: "rgba(0,0,0,0.12)",
    axisColor: "#cccccc",
    tooltipBg: "#ffffff",
    tooltipBorder: "#000000",
    tooltipText: "#000000",
    lineColors: {
      sma20: "#da291c",
      sma50: "#000000",
      bbUpper: "#cccccc",
      bbLower: "#cccccc",
      vwap: "#999",
    },
    backgroundColor: "#ffffff",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  swissDark: {
    candleUp: "#00bdf0",
    candleDown: "#e84040",
    gridColor: "rgba(255,255,255,0.08)",
    textColor: "#888888",
    volumeColor: "rgba(255,255,255,0.12)",
    axisColor: "#333333",
    tooltipBg: "#141414",
    tooltipBorder: "#e84040",
    tooltipText: "#f5f5f5",
    lineColors: {
      sma20: "#e84040",
      sma50: "#ffffff",
      bbUpper: "#555555",
      bbLower: "#555555",
      vwap: "#888888",
    },
    backgroundColor: "#0a0a0a",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  cyber: {
    candleUp: "#00ffff",
    candleDown: "#ff00ff",
    gridColor: "rgba(0,255,255,0.05)",
    textColor: "rgba(224,224,255,0.5)",
    volumeColor: "rgba(0,255,255,0.1)",
    axisColor: "rgba(0,255,255,0.15)",
    tooltipBg: "rgba(13,2,33,0.95)",
    tooltipBorder: "#00ffff",
    tooltipText: "#e0e0ff",
    lineColors: {
      sma20: "rgba(255,255,0,0.7)",
      sma50: "rgba(255,0,255,0.5)",
      bbUpper: "rgba(0,255,255,0.2)",
      bbLower: "rgba(0,255,255,0.2)",
      vwap: "rgba(255,0,255,0.4)",
    },
    backgroundColor: "#0d0221",
    fontFamily: '"Rajdhani", sans-serif',
  },
};

interface CandleData extends ChartPoint {
  yOffset: number;
  priceScale: (v: number) => number;
}

interface CandleProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: CandleData;
  theme?: ChartTheme;
}

function Candlestick(props: CandleProps) {
  const { x = 0, width = 0, payload, theme } = props;
  if (!payload) return null;

  const { open, high, low, close, yOffset, priceScale } = payload;
  if (!priceScale || high == null || low == null || open == null || close == null) {
    return null;
  }

  const isUp = close >= open;
  const color = isUp ? (theme?.candleUp ?? "#00ff41") : (theme?.candleDown ?? "#ff0040");
  
  const bodyTop = priceScale(Math.max(open, close));
  const bodyBottom = priceScale(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  
  const wickTop = priceScale(high);
  const wickBottom = priceScale(low);
  
  const wickWidth = Math.max(width * 0.06, 1);
  const bodyWidth = Math.max(width * 0.7, 3);

  return (
    <g>
      <line
        x1={x + width / 2}
        y1={wickTop - yOffset}
        x2={x + width / 2}
        y2={wickBottom - yOffset}
        stroke={color}
        strokeWidth={wickWidth}
      />
      <rect
        x={x + (width - bodyWidth) / 2}
        y={bodyTop - yOffset}
        width={bodyWidth}
        height={bodyHeight}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint; value: number; name: string }>;
  label?: string;
  theme: ChartTheme;
}

function CustomTooltip({ active, payload, label, theme }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload as ChartPoint;
  if (!d) return null;

  const isUp = d.close >= d.open;

  return (
    <div
      style={{
        background: theme.tooltipBg,
        border: `1px solid ${theme.tooltipBorder}`,
        padding: "10px 14px",
        fontSize: "12px",
        fontFamily: theme.fontFamily,
        color: theme.tooltipText,
        minWidth: "160px",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, borderBottom: `2px solid ${isUp ? theme.candleUp : theme.candleDown}`, paddingBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "2px 12px" }}>
        <span style={{ color: theme.textColor }}>O</span>
        <strong style={{ textAlign: "right" }}>{d.open?.toFixed(2)}</strong>
        <span style={{ color: theme.textColor }}>H</span>
        <strong style={{ textAlign: "right", color: theme.candleUp }}>{d.high?.toFixed(2)}</strong>
        <span style={{ color: theme.textColor }}>L</span>
        <strong style={{ textAlign: "right", color: theme.candleDown }}>{d.low?.toFixed(2)}</strong>
        <span style={{ color: theme.textColor }}>C</span>
        <strong style={{ textAlign: "right", color: isUp ? theme.candleUp : theme.candleDown }}>{d.close?.toFixed(2)}</strong>
      </div>
      {d.volume && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${theme.axisColor}` }}>
          <span style={{ color: theme.textColor }}>Vol:</span> <strong>{(d.volume / 1000000).toFixed(1)}M</strong>
        </div>
      )}
      {d.sma_20 && (
        <div style={{ marginTop: 4, color: theme.lineColors.sma20 }}>
          SMA20: {d.sma_20?.toFixed(2)}
        </div>
      )}
      {d.sma_50 && (
        <div style={{ color: theme.lineColors.sma50 }}>
          SMA50: {d.sma_50?.toFixed(2)}
        </div>
      )}
    </div>
  );
}

interface OHLCVChartProps {
  data: ChartPoint[];
  theme?: string | ChartTheme;
  isDark?: boolean;
  height?: number;
  overlays?: {
    sma20?: boolean;
    sma50?: boolean;
    bollingerBands?: boolean;
    vwap?: boolean;
  };
  showVolume?: boolean;
  className?: string;
}

export default function OHLCVChart({
  data,
  theme = "brutal",
  isDark = false,
  height = 380,
  overlays = { sma20: true, sma50: true, bollingerBands: false, vwap: false },
  showVolume = true,
  className = "",
}: OHLCVChartProps) {
  const getTheme = () => {
    if (typeof theme !== "string") return theme;
    if (theme === "swiss" && isDark) return CHART_THEMES.swissDark;
    return CHART_THEMES[theme] ?? CHART_THEMES.brutal;
  };
  const t = getTheme();

  const priceH = showVolume ? Math.round(height * 0.72) : height;
  const volumeH = showVolume ? height - priceH - 4 : 0;

  const prices = data.flatMap((d) => [d.high ?? d.close, d.low ?? d.close]).filter(Boolean);
  const minPrice = Math.min(...prices) * 0.995;
  const maxPrice = Math.max(...prices) * 1.005;

  const priceScale = (v: number) => {
    return priceH - ((v - minPrice) / (maxPrice - minPrice)) * priceH;
  };

  const enrichedData = data.map((d) => ({
    ...d,
    yOffset: 0,
    priceScale,
  }));

  return (
    <div
      className={className}
      style={{
        background: t.backgroundColor ?? "transparent",
        fontFamily: t.fontFamily,
      }}
    >
      <ResponsiveContainer width="100%" height={priceH}>
        <ComposedChart
          data={enrichedData}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={t.gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: t.textColor }}
            axisLine={{ stroke: t.axisColor }}
            tickLine={false}
            interval={Math.floor(data.length / 6)}
            tickFormatter={(v: string) => {
              const d = new Date(v);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 10, fill: t.textColor }}
            axisLine={{ stroke: t.axisColor }}
            tickLine={false}
            tickFormatter={(v: number) => v.toFixed(0)}
            width={56}
          />
          <Tooltip content={<CustomTooltip theme={t} />} />

          {overlays.bollingerBands && (
            <>
              <Line
                type="monotone"
                dataKey="bb_upper"
                stroke={t.lineColors.bbUpper}
                strokeWidth={1}
                dot={false}
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="bb_lower"
                stroke={t.lineColors.bbLower}
                strokeWidth={1}
                dot={false}
                strokeDasharray="3 3"
              />
            </>
          )}

          {overlays.sma50 && (
            <Line
              type="monotone"
              dataKey="sma_50"
              stroke={t.lineColors.sma50}
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 3"
            />
          )}
          {overlays.sma20 && (
            <Line
              type="monotone"
              dataKey="sma_20"
              stroke={t.lineColors.sma20}
              strokeWidth={1.5}
              dot={false}
            />
          )}
          {overlays.vwap && (
            <Line
              type="monotone"
              dataKey="vwap_20"
              stroke={t.lineColors.vwap}
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="2 2"
            />
          )}

          <Bar
            dataKey="close"
            shape={(props: CandleProps) => <Candlestick {...props} theme={t} />}
            legendType="none"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {showVolume && (
        <ResponsiveContainer width="100%" height={volumeH}>
          <ComposedChart
            data={data}
            margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={t.gridColor}
              vertical={false}
            />
            <XAxis dataKey="date" hide />
            <YAxis
              tick={{ fontSize: 9, fill: t.textColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`}
              width={56}
            />
            <Bar
              dataKey="volume"
              fill={t.volumeColor}
              radius={[1, 1, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

interface OverlayToggleProps {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
  style?: "brutal" | "editorial" | "glass" | "swiss" | "cyber";
}

export function OverlayToggle({
  label,
  active,
  color,
  onClick,
  style = "brutal",
}: OverlayToggleProps) {
  const baseStyles: Record<string, string> = {
    brutal: "font-mono text-xs px-3 py-1 border-2 cursor-pointer transition-all select-none",
    editorial: "text-xs px-3 py-1 border cursor-pointer transition-all select-none",
    glass: "text-xs px-3 py-1 rounded-full cursor-pointer transition-all select-none backdrop-blur-sm",
    swiss: "text-xs px-3 py-1 cursor-pointer transition-all select-none uppercase tracking-widest",
    cyber: "text-xs px-3 py-1 cursor-pointer transition-all select-none font-mono",
  };

  return (
    <button
      onClick={onClick}
      className={baseStyles[style] ?? baseStyles.brutal}
      style={{
        borderColor: color,
        backgroundColor: active ? color : "transparent",
        color: active 
          ? (style === "glass" ? "#000000" : style === "swiss" ? "#ffffff" : "#ffffff")
          : color,
      }}
    >
      {label}
    </button>
  );
}
