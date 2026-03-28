"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ComposedChart,
} from "recharts";
import type { ChartPoint } from "@/types/api";

interface ChartTheme {
  bg: string;
  gridColor: string;
  textColor: string;
  candleUp: string;
  candleDown: string;
  volumeUp: string;
  volumeDown: string;
}

const lightTheme: ChartTheme = {
  bg: "#ffffff",
  gridColor: "#e8e8e8",
  textColor: "#666666",
  candleUp: "#00a9e0",
  candleDown: "#da291c",
  volumeUp: "rgba(0,169,224,0.5)",
  volumeDown: "rgba(218,41,28,0.5)",
};

const darkTheme: ChartTheme = {
  bg: "#0a0a0a",
  gridColor: "rgba(255,255,255,0.1)",
  textColor: "#888888",
  candleUp: "#00bdf0",
  candleDown: "#e84040",
  volumeUp: "rgba(0,189,240,0.5)",
  volumeDown: "rgba(232,64,64,0.5)",
};

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isUp: boolean;
  color: string;
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
  const color = isUp ? (theme?.candleUp ?? "#00a9e0") : (theme?.candleDown ?? "#da291c");
  
  const bodyTop = priceScale(Math.max(open, close));
  const bodyBottom = priceScale(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  
  const wickTop = priceScale(high);
  const wickBottom = priceScale(low);
  
  const wickWidth = Math.max(width * 0.04, 1);
  const bodyWidth = Math.max(width * 0.8, 3);

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
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
}

interface TradingChartProps {
  data: ChartPoint[];
  isDark?: boolean;
  indicators?: string[];
  showVolume?: boolean;
  showRSI?: boolean;
  showMACD?: boolean;
  showStochastic?: boolean;
  showADX?: boolean;
  height?: number;
}

export default function TradingChart({
  data,
  isDark = false,
  indicators = [],
  showVolume = true,
  showRSI = false,
  showMACD = false,
  showStochastic = false,
  showADX = false,
  height = 600,
}: TradingChartProps) {
  const theme = isDark ? darkTheme : lightTheme;
  
  const closes = data.map(d => d.close ?? 0);
  const prices = data.flatMap((d) => [d.high ?? d.close, d.low ?? d.close]).filter(Boolean);
  const minPrice = Math.min(...prices) * 0.995;
  const maxPrice = Math.max(...prices) * 1.005;
  
  const priceScale = (v: number) => {
    const mainHeight = height - (showVolume ? 80 : 0) - ((showRSI || showMACD || showStochastic || showADX) ? 80 : 0) - 20;
    return mainHeight - ((v - minPrice) / (maxPrice - minPrice)) * mainHeight;
  };
  
  const candleData = useMemo(() => {
    return data.map((d) => ({
      date: d.date,
      open: d.open ?? d.close ?? 0,
      high: d.high ?? d.close ?? 0,
      low: d.low ?? d.close ?? 0,
      close: d.close ?? 0,
      volume: d.volume ?? 0,
      isUp: (d.close ?? 0) >= (d.open ?? 0),
      color: (d.close ?? 0) >= (d.open ?? 0) ? theme.candleUp : theme.candleDown,
      yOffset: 0,
      priceScale,
    }));
  }, [data, theme, priceScale]);
  
  const sma20 = useMemo(() => {
    return candleData.map((d, i) => {
      if (i < 19) return null;
      const slice = closes.slice(i - 19, i + 1);
      return slice.reduce((a, b) => a + b, 0) / 20;
    });
  }, [closes, candleData]);
  
  const sma50 = useMemo(() => {
    return candleData.map((d, i) => {
      if (i < 49) return null;
      const slice = closes.slice(i - 49, i + 1);
      return slice.reduce((a, b) => a + b, 0) / 50;
    });
  }, [closes, candleData]);
  
  const rsi = useMemo(() => {
    const result: (number | null)[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    closes.forEach((c, i) => {
      if (i === 0) {
        result.push(null);
        return;
      }
      const change = c - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
      
      if (i < 14) {
        result.push(null);
      } else {
        const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
        const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
        result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
      }
    });
    return result;
  }, [closes]);
  
  const chartData = useMemo(() => {
    return candleData.map((d, i) => ({
      ...d,
      sma20: sma20[i],
      sma50: sma50[i],
      rsi: rsi[i],
    }));
  }, [candleData, sma20, sma50, rsi]);
  
  const volumes = data.map(d => d.volume ?? 0);
  const maxVolume = Math.max(...volumes, 1) * 1.2;
  
  const volumeHeight = showVolume ? 80 : 0;
  const indicatorHeight = (showRSI || showMACD || showStochastic || showADX) ? 80 : 0;
  const mainHeight = height - volumeHeight - indicatorHeight - 20;
  
  const tickStyle = { fontSize: 10, fill: theme.textColor };
  const axisLineStyle = { stroke: theme.gridColor };
  
  return (
    <div style={{ background: theme.bg, width: "100%", height }}>
      <ResponsiveContainer width="100%" height={mainHeight}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} vertical={false} />
          <XAxis
            dataKey="date"
            tick={tickStyle}
            axisLine={axisLineStyle}
            tickLine={false}
            interval={Math.floor(data.length / 6)}
            tickFormatter={(v: string) => {
              const d = new Date(v);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis
            tick={tickStyle}
            axisLine={axisLineStyle}
            tickLine={false}
            tickFormatter={(v: number) => v.toFixed(0)}
            width={60}
            orientation="right"
            domain={[minPrice, maxPrice]}
          />
          
          <Bar dataKey="close" shape={(props: CandleProps) => <Candlestick {...props} theme={theme} />} legendType="none" isAnimationActive={false}>
            {chartData.map((entry, index) => (
              <Cell key={`candle-${index}`} fill="transparent" />
            ))}
          </Bar>
          
          {indicators.includes("sma20") && (
            <Line type="monotone" dataKey="sma20" stroke="#ff6b35" strokeWidth={2} dot={false} connectNulls />
          )}
          {indicators.includes("sma50") && (
            <Line type="monotone" dataKey="sma50" stroke={isDark ? "#ffffff" : "#000000"} strokeWidth={2} dot={false} connectNulls />
          )}
          
          <Tooltip
            contentStyle={{ 
              background: isDark ? "#1a1a1a" : "#ffffff", 
              border: `1px solid ${isDark ? "#333" : "#dddddd"}`,
              fontSize: 11,
              fontFamily: "monospace"
            }}
            labelStyle={{ color: theme.textColor }}
            itemStyle={{ color: theme.textColor }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {showVolume && (
        <ResponsiveContainer width="100%" height={volumeHeight}>
          <BarChart data={chartData} margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis 
              tick={tickStyle} 
              axisLine={false} 
              tickLine={false} 
              domain={[0, maxVolume]} 
              tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} 
              width={60} 
              orientation="right" 
            />
            <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`vol-${index}`} fill={entry.isUp ? theme.volumeUp : theme.volumeDown} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {showRSI && (
        <div style={{ borderTop: `1px solid ${theme.gridColor}`, height: indicatorHeight }}>
          <div style={{ fontSize: 9, color: theme.textColor, padding: "2px 70px 0 10px" }}>RSI(14)</div>
          <ResponsiveContainer width="100%" height={indicatorHeight - 16}>
            <LineChart data={chartData} margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} domain={[0, 100]} width={60} orientation="right" />
              <ReferenceLine y={70} stroke={theme.candleDown} strokeDasharray="4 4" />
              <ReferenceLine y={30} stroke={theme.candleUp} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="rsi" stroke="#9944cc" strokeWidth={1.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export { lightTheme, darkTheme };
