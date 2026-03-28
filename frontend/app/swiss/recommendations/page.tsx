"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRecommendations } from "@/lib/api/hooks";
import { formatTicker, formatPrice, formatPct } from "@/lib/utils/format";
import { horizonToDate, formatTradingDate } from "@/lib/utils/trading";
import { useWatchlist } from "@/lib/utils/watchlist";
import { useSwissTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import {
  BookmarkPlus,
  BookmarkCheck,
  ChevronUp,
  ChevronDown,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Suspense } from "react";

const HV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
type SortKey = "confidence" | "return" | "rr";

function WatchlistCell({ ticker }: { ticker: string }) {
  const { toggle, has } = useWatchlist();
  const c = useSwissTheme();
  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={() => toggle(ticker)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
      >
        {has(ticker) ? (
          <BookmarkCheck size={12} color={c.accentRed} />
        ) : (
          <BookmarkPlus size={12} color={c.textMuted} />
        )}
      </button>
    </div>
  );
}

function SwissRecommendationsInner() {
  const searchParams = useSearchParams();
  const [horizon, setHorizon] = useState(Number(searchParams.get("horizon") ?? 1));
  const [side, setSide] = useState<"both" | "long" | "short">("both");
  const [topN, setTopN] = useState(25);
  const [sortKey, setSortKey] = useState<SortKey>("confidence");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
  const c = useSwissTheme();

  const { data, loading } = useRecommendations({ horizon, top_n: topN });

  let cards = data?.cards ?? [];
  if (side !== "both") {
    cards = cards.filter((card) => card.direction === side);
  }
  if (search)
    cards = cards.filter(
      (card) =>
        card.ticker.toLowerCase().includes(search.toLowerCase()) ||
        card.company_name.toLowerCase().includes(search.toLowerCase()),
    );

  cards = [...cards].sort((a, b) => {
    const av =
      sortKey === "confidence"
        ? a.confidence_pct
        : sortKey === "return"
          ? Math.abs(a.expected_return_pct ?? 0)
          : (a.risk_reward_ratio ?? 0);
    const bv =
      sortKey === "confidence"
        ? b.confidence_pct
        : sortKey === "return"
          ? Math.abs(b.expected_return_pct ?? 0)
          : (b.risk_reward_ratio ?? 0);
    return sortAsc ? av - bv : bv - av;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : null;

  const confDist = [
    { r: "50-60", n: cards.filter((card) => card.confidence_pct >= 50 && card.confidence_pct < 60).length },
    { r: "60-70", n: cards.filter((card) => card.confidence_pct >= 60 && card.confidence_pct < 70).length },
    { r: "70-80", n: cards.filter((card) => card.confidence_pct >= 70 && card.confidence_pct < 80).length },
    { r: "80-90", n: cards.filter((card) => card.confidence_pct >= 80 && card.confidence_pct < 90).length },
    { r: "90+", n: cards.filter((card) => card.confidence_pct >= 90).length },
  ];

  const targetDate = horizonToDate(horizon);

  return (
    <div className="py-12">
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: HV,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: c.textSecondary,
            marginBottom: "8px",
          }}
        >
          Signal Feed — {cards.length} results
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: HV, fontSize: "52px", fontWeight: 900, color: c.textPrimary, letterSpacing: "-0.04em", lineHeight: 0.9 }}>
            Recommendations
          </h1>
          <div style={{ textAlign: "right", fontFamily: HV }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: c.accentRed, marginBottom: "2px" }}>
              <Clock size={11} /> {formatTradingDate(targetDate)}
            </div>
            <div style={{ fontSize: "11px", color: c.textSecondary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Target date
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: "2px", background: c.textPrimary, marginBottom: "20px" }} />

      {/* Filter Row */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Horizon */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "5px" }}>
            Horizon
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {[1, 3, 5, 7, 10].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                style={{
                  fontFamily: HV, fontSize: "10px", fontWeight: horizon === h ? 700 : 400,
                  padding: "4px 8px",
                  background: horizon === h ? c.textPrimary : "transparent",
                  border: `1px solid ${horizon === h ? c.textPrimary : c.borderSecondary}`,
                  color: horizon === h ? c.bgPrimary : c.textSecondary,
                  cursor: "pointer", letterSpacing: "0.05em",
                }}
              >
                {h}D
              </button>
            ))}
          </div>
        </div>

        {/* Direction */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "5px" }}>
            Direction
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {(["both", "long", "short"] as const).map((s) => {
              const sc = s === "long" ? c.accentCyan : s === "short" ? c.accentRed : c.accentNeutral;
              const isActive = side === s;
              return (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  style={{
                    fontFamily: HV, fontSize: "10px", fontWeight: isActive ? 700 : 400,
                    padding: "4px 10px",
                    background: isActive ? sc : "transparent",
                    border: `1px solid ${isActive ? sc : c.borderSecondary}`,
                    color: isActive ? "#fff" : c.textSecondary,
                    cursor: "pointer", textTransform: "capitalize", letterSpacing: "0.05em",
                  }}
                >
                  {s === "both" ? "All" : s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Top N */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "5px" }}>
            Show
          </div>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            style={{ fontFamily: HV, fontSize: "11px", color: c.textPrimary, background: c.bgInput, border: `1px solid ${c.borderSecondary}`, borderTop: `2px solid ${c.textPrimary}`, padding: "4px 8px", cursor: "pointer" }}
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>Top {n}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "5px" }}>
            Search
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ticker…"
            style={{ fontFamily: HV, fontSize: "11px", color: c.textPrimary, background: c.bgInput, border: `1px solid ${c.borderSecondary}`, borderTop: `2px solid ${c.textPrimary}`, padding: "4px 8px", width: "140px", outline: "none" }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "40px", alignItems: "start" }}>
        {/* Table */}
        <div>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2.5rem 1fr 2fr 4.5rem 4rem 4rem 4rem 4.5rem 2rem",
              gap: "10px",
              borderTop: `2px solid ${c.textPrimary}`,
              borderBottom: `2px solid ${c.textPrimary}`,
              padding: "7px 0",
              fontFamily: HV, fontSize: "9px", fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: c.textSecondary,
            }}
          >
            <div>#</div>
            <div>Ticker</div>
            <div>Company</div>
            {(["confidence", "return", null, null, "rr"] as (SortKey | null)[]).map((key, i) => {
              const labels = ["Conf", "Ret", "Entry", "Target", "R/R"];
              if (key) {
                return (
                  <button
                    key={i}
                    onClick={() => handleSort(key)}
                    style={{
                      all: "unset", cursor: "pointer", textAlign: "right",
                      display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "2px",
                      color: sortKey === key ? c.accentRed : c.textSecondary,
                      fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: HV,
                    }}
                  >
                    {labels[i]} <SortIcon col={key} />
                  </button>
                );
              }
              return <div key={i} style={{ textAlign: "right" }}>{labels[i]}</div>;
            })}
            <div style={{ textAlign: "center" }}>WL</div>
          </div>

          {/* Rows */}
          {loading
            ? Array(8).fill(0).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: "44px",
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    background: `linear-gradient(90deg, ${c.shimmerStart} 0%, ${c.shimmerMid} 50%, ${c.shimmerStart} 100%)`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    marginBottom: "1px",
                  }}
                />
              ))
            : cards.map((card, i) => {
                const isBullCard = card.direction === "long";
                const rowColor = isBullCard ? c.accentCyan : card.direction === "short" ? c.accentRed : c.textPrimary;
                return (
                  <div
                    key={`${card.ticker}-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.5rem 1fr 2fr 4.5rem 4rem 4rem 4rem 4.5rem 2rem",
                      gap: "10px",
                      padding: "9px 0",
                      borderBottom: `1px solid ${c.borderSubtle}`,
                      fontFamily: HV,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: c.textMuted, fontVariantNumeric: "tabular-nums" }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <Link
                        href={`/swiss/stocks/${card.ticker}`}
                        style={{ textDecoration: "none", fontWeight: 700, fontSize: "13px", color: rowColor, display: "block" }}
                      >
                        {formatTicker(card.ticker)}
                      </Link>
                      <div style={{ fontSize: "9px", color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {card.direction} · {card.horizon}
                      </div>
                    </div>
                    <div style={{ fontSize: "11px", color: c.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {card.company_name}
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: "12px", color: rowColor, fontVariantNumeric: "tabular-nums" }}>
                      {card.confidence_pct.toFixed(0)}%
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 600, fontSize: "11px", color: isBullCard ? c.accentCyan : c.accentRed, fontVariantNumeric: "tabular-nums" }}>
                      {formatPct(card.expected_return_pct)}
                    </div>
                    <div style={{ textAlign: "right", fontSize: "11px", color: c.textSecondary, fontVariantNumeric: "tabular-nums" }}>
                      ₹{formatPrice(card.entry_price)}
                    </div>
                    <div style={{ textAlign: "right", fontSize: "11px", color: c.accentCyan, fontVariantNumeric: "tabular-nums" }}>
                      ₹{formatPrice(card.target_price)}
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: "12px", color: c.textPrimary, fontVariantNumeric: "tabular-nums" }}>
                      {card.risk_reward_ratio?.toFixed(2)}
                    </div>
                    <WatchlistCell ticker={card.ticker} />
                  </div>
                );
              })}
        </div>

        {/* Sidebar */}
        <div style={{ position: "sticky", top: "80px" }}>
          <div style={{ borderTop: `2px solid ${c.accentRed}`, paddingTop: "12px", marginBottom: "20px" }}>
            <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "10px" }}>
              Confidence distribution
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={confDist} barSize={28}>
                <XAxis dataKey="r" tick={{ fontSize: 9, fontFamily: HV, fill: c.textMuted }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontFamily: HV, fontSize: "10px", border: `1px solid ${c.textPrimary}`, background: c.tooltipBg, color: c.tooltipText }}
                />
                <Bar dataKey="n" name="Signals" radius={[1, 1, 0, 0]}>
                  {confDist.map((_, idx) => (
                    <Cell key={idx} fill={idx < 2 ? c.borderSecondary : idx === 2 ? c.textMuted : idx === 3 ? c.accentCyan : c.accentRed} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ borderTop: `1px solid ${c.borderSubtle}`, paddingTop: "12px" }}>
            <div style={{ fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textMuted, marginBottom: "8px" }}>
              Jump to horizon
            </div>
            {[1, 3, 5, 7, 10].filter((h) => h !== horizon).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                style={{
                  display: "flex", justifyContent: "space-between", width: "100%",
                  background: "none", border: "none", cursor: "pointer",
                  padding: "6px 0", borderBottom: `1px solid ${c.borderSubtle}`,
                  fontFamily: HV, fontSize: "11px", color: c.textSecondary, textAlign: "left",
                }}
              >
                <span style={{ fontWeight: 700, color: c.textPrimary }}>{h}D</span>
                <span style={{ fontSize: "10px", color: c.textMuted }}>{formatTradingDate(horizonToDate(h))}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SwissRecommendations() {
  return (
    <Suspense fallback={<div className="py-12" style={{ fontFamily: '"Helvetica Neue", sans-serif', fontSize: "13px" }}>Loading…</div>}>
      <SwissRecommendationsInner />
    </Suspense>
  );
}
