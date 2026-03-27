"use client";

import { useWatchlist } from "@/lib/utils/watchlist";
import { COMPANY_NAMES, SECTOR_MAP } from "@/lib/utils/trading";
import { useRecommendations } from "@/lib/api/hooks";
import { formatTicker, formatPrice, formatPct } from "@/lib/utils/format";
import { useSwissTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import { BookmarkX, ArrowRight } from "lucide-react";
import { useState } from "react";

const HV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function SwissWatchlist() {
  const { watchlist, remove } = useWatchlist();
  const [horizon, setHorizon] = useState(1);
  const { data, loading } = useRecommendations({ horizon, top_n: 50 });
  const c = useSwissTheme();

  const watchlistData = watchlist.map((ticker) => ({
    ticker,
    card: data?.cards.find((card) => card.ticker === ticker),
  }));

  return (
    <div className="py-12">
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: c.textSecondary, marginBottom: "8px" }}>
          Personal Selection
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h1 style={{ fontFamily: HV, fontSize: "52px", fontWeight: 900, color: c.textPrimary, letterSpacing: "-0.04em", lineHeight: 0.9 }}>
            Watchlist
          </h1>
          {watchlist.length > 0 && (
            <div style={{ fontFamily: HV, fontSize: "11px", fontWeight: 700, color: c.textPrimary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {watchlist.length} STOCKS
            </div>
          )}
        </div>
      </div>

      <div style={{ height: "2px", background: c.textPrimary, marginBottom: "24px" }} />

      {watchlist.length === 0 ? (
        <div style={{ padding: "60px 0", borderTop: `1px solid ${c.borderSubtle}` }}>
          <div style={{ fontFamily: HV, fontSize: "16px", color: c.textMuted, marginBottom: "12px" }}>Watchlist empty</div>
          <p style={{ fontFamily: HV, fontSize: "13px", color: c.textSecondary, marginBottom: "16px" }}>
            Add stocks using the bookmark icon in the signals table.
          </p>
          <Link href="/swiss/recommendations" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: HV, fontSize: "11px", color: c.accentRed, textDecoration: "underline", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Go to Signals <ArrowRight size={11} />
          </Link>
        </div>
      ) : (
        <>
          {/* Horizon selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <span style={{ fontFamily: HV, fontSize: "10px", fontWeight: 700, color: c.textMuted, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Horizon:
            </span>
            {[1, 3, 5, 7, 10].map((h) => (
              <button key={h} onClick={() => setHorizon(h)} style={{ fontFamily: HV, fontSize: "10px", fontWeight: horizon === h ? 700 : 400, padding: "3px 7px", background: horizon === h ? c.textPrimary : "transparent", border: `1px solid ${horizon === h ? c.textPrimary : c.borderSecondary}`, color: horizon === h ? c.bgPrimary : c.textSecondary, cursor: "pointer", letterSpacing: "0.05em" }}>
                {h}D
              </button>
            ))}
          </div>

          {/* Table header */}
          <div style={{ borderTop: `2px solid ${c.textPrimary}`, borderBottom: `2px solid ${c.textPrimary}`, padding: "6px 0", display: "grid", gridTemplateColumns: "1fr 2fr 3.5rem 4rem 4rem 4.5rem 4rem 2rem", gap: "12px", fontFamily: HV, fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: c.textSecondary }}>
            <div>Ticker</div>
            <div>Company</div>
            <div style={{ textAlign: "right" }}>Sector</div>
            <div style={{ textAlign: "right" }}>Signal</div>
            <div style={{ textAlign: "right" }}>Conf.</div>
            <div style={{ textAlign: "right" }}>Return</div>
            <div style={{ textAlign: "right" }}>R/R</div>
            <div style={{ textAlign: "center" }}>—</div>
          </div>

          {watchlistData.map(({ ticker, card }) => {
            const isBull = card?.direction === "long";
            const rowColor = isBull ? c.accentCyan : card?.direction === "short" ? c.accentRed : c.textSecondary;
            return (
              <div key={ticker} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 3.5rem 4rem 4rem 4.5rem 4rem 2rem", gap: "12px", padding: "10px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV, alignItems: "center" }}>
                <div>
                  <Link href={`/swiss/stocks/${ticker}`} style={{ textDecoration: "none", fontWeight: 700, fontSize: "13px", color: c.textPrimary }}>
                    {formatTicker(ticker)}
                  </Link>
                </div>
                <div style={{ fontSize: "11px", color: c.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {COMPANY_NAMES[ticker] ?? ticker}
                </div>
                <div style={{ textAlign: "right", fontSize: "9px", color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {SECTOR_MAP[ticker]?.split(" ")[0] ?? "—"}
                </div>
                {loading ? (
                  <>
                    <div style={{ height: "14px", background: c.borderSubtle, gridColumn: "span 4" }} />
                    <div />
                  </>
                ) : card ? (
                  <>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: "10px", color: rowColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.direction}</div>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: "12px", color: rowColor, fontVariantNumeric: "tabular-nums" }}>{card.confidence_pct.toFixed(0)}%</div>
                    <div style={{ textAlign: "right", fontSize: "11px", color: isBull ? c.accentCyan : c.accentRed, fontVariantNumeric: "tabular-nums" }}>{formatPct(card.expected_return_pct)}</div>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: "11px", color: c.textPrimary, fontVariantNumeric: "tabular-nums" }}>{card.risk_reward_ratio?.toFixed(2)}</div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: "right", fontSize: "10px", color: c.textMuted }}>no signal</div>
                    <div /><div /><div />
                  </>
                )}
                <button onClick={() => remove(ticker)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "2px" }} title="Remove">
                  <BookmarkX size={12} color={c.textMuted} />
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
