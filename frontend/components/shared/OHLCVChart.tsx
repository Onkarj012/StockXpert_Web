"use client";

import React, { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

// Candlestick as a custom bar shape
interface CandleProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartPoint;
  theme?: ChartTheme;
  dataKey?: string;
}

function CustomCandlestick(props: CandleProps) {
  const { x = 0, y = 0, width = 0, payload, theme } = props;
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isUp = close >= open;
  const color = isUp
    ? (theme?.candleUp ?? "#00ff41")
    : (theme?.candleDown ?? "#ff0040");

  const priceRange = high - low;
  if (priceRange === 0) return null;

  // We need chart scale, use recharts yAxis values
  // Since we use Bar underneath, we can derive scale from y and height
  // But for simple approach we use a Scatter/custom approach below
  // Fallback: render a colored rectangle showing direction
  const rectWidth = Math.max(width * 0.6, 2);
  const rectX = x + (width - rectWidth) / 2;

  return (
    <rect
      x={rectX}
      y={y}
      width={rectWidth}
      height={Math.max(Math.abs(props.height ?? 4), 2)}
      fill={color}
      rx={0}
    />
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
  const d = payload[0]?.payload;
  if (!d) return null;

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
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div>
        O: <strong>{d.open?.toFixed(2)}</strong>
      </div>
      <div>
        H: <strong>{d.high?.toFixed(2)}</strong>
      </div>
      <div>
        L: <strong>{d.low?.toFixed(2)}</strong>
      </div>
      <div>
        C: <strong>{d.close?.toFixed(2)}</strong>
      </div>
      {d.volume && (
        <div style={{ marginTop: 4 }}>
          Vol: <strong>{(d.volume / 1000000).toFixed(1)}M</strong>
        </div>
      )}
      {d.sma_20 && (
        <div style={{ color: theme.lineColors.sma20 }}>
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
  height = 380,
  overlays = { sma20: true, sma50: true, bollingerBands: false, vwap: false },
  showVolume = true,
  className = "",
}: OHLCVChartProps) {
  const t =
    typeof theme === "string"
      ? (CHART_THEMES[theme] ?? CHART_THEMES.brutal)
      : theme;

  // Separate chart heights
  const priceH = showVolume ? Math.round(height * 0.72) : height;
  const volumeH = showVolume ? height - priceH - 4 : 0;

  const prices = data.map((d) => d.close).filter(Boolean);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;

  return (
    <div
      className={className}
      style={{
        background: t.backgroundColor ?? "transparent",
        fontFamily: t.fontFamily,
      }}
    >
      {/* Price Chart */}
      <ResponsiveContainer width="100%" height={priceH}>
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
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
            width={52}
          />
          <Tooltip content={<CustomTooltip theme={t} />} />

          {/* Candlestick using High-Low as Bar + Open-Close as Bar */}
          <Bar dataKey="low" fill="transparent" legendType="none" />
          <Bar
            dataKey="high"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shape={(props: any) => <CustomCandlestick {...props} theme={t} />}
            fill={t.candleUp}
            legendType="none"
          />

          {/* Price line fallback for visibility */}
          <Line
            type="monotone"
            dataKey="close"
            stroke={t.candleUp}
            strokeWidth={1.5}
            dot={false}
            legendType="none"
          />

          {overlays.sma20 && (
            <Line
              type="monotone"
              dataKey="sma_20"
              stroke={t.lineColors.sma20}
              strokeWidth={1}
              dot={false}
              strokeDasharray="4 2"
            />
          )}
          {overlays.sma50 && (
            <Line
              type="monotone"
              dataKey="sma_50"
              stroke={t.lineColors.sma50}
              strokeWidth={1}
              dot={false}
              strokeDasharray="6 3"
            />
          )}
          {overlays.bollingerBands && (
            <>
              <Line
                type="monotone"
                dataKey="bb_upper"
                stroke={t.lineColors.bbUpper}
                strokeWidth={1}
                dot={false}
                strokeDasharray="2 4"
              />
              <Line
                type="monotone"
                dataKey="bb_lower"
                stroke={t.lineColors.bbLower}
                strokeWidth={1}
                dot={false}
                strokeDasharray="2 4"
              />
            </>
          )}
          {overlays.vwap && (
            <Line
              type="monotone"
              dataKey="vwap_20"
              stroke={t.lineColors.vwap}
              strokeWidth={1.5}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume Chart */}
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
              width={52}
            />
            <Bar dataKey="volume" fill={t.volumeColor} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Overlay toggle button component
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
  const styles: Record<string, string> = {
    brutal: `font-mono text-xs px-3 py-1 border-2 cursor-pointer transition-all select-none ${active ? "text-black" : "bg-transparent"}`,
    editorial: `text-xs px-3 py-1 border cursor-pointer transition-all select-none ${active ? "text-white" : "bg-transparent"}`,
    glass: `text-xs px-3 py-1 rounded-full cursor-pointer transition-all select-none backdrop-blur-sm`,
    swiss: `text-xs px-3 py-1 cursor-pointer transition-all select-none uppercase tracking-widest`,
    cyber: `text-xs px-3 py-1 cursor-pointer transition-all select-none font-mono`,
  };

  return (
    <button
      onClick={onClick}
      className={styles[style]}
      style={{
        borderColor: color,
        backgroundColor: active ? color : "transparent",
        color: active ? (style === "glass" ? "#000" : undefined) : color,
      }}
    >
      {label}
    </button>
  );
}
