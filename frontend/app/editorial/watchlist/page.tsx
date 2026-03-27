"use client";

import { useWatchlist } from "@/lib/utils/watchlist";
import { COMPANY_NAMES, SECTOR_MAP } from "@/lib/utils/trading";
import { useRecommendations } from "@/lib/api/hooks";
import { formatTicker, formatPrice, formatPct } from "@/lib/utils/format";
import { useEditorialTheme } from "@/lib/utils/ThemeContext";
import Link from "next/link";
import { BookmarkX, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function EditorialWatchlist() {
  const { watchlist, remove } = useWatchlist();
  const [horizon, setHorizon] = useState(1);
  const { data, loading } = useRecommendations({ horizon, top_n: 50 });
  const c = useEditorialTheme();

  const watchlistData = watchlist.map((ticker) => {
    const card = data?.cards.find((c) => c.ticker === ticker);
    return { ticker, card };
  });

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            fontFamily: '"Georgia", serif',
            fontSize: "11px",
            color: c.accentGold,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Personal Watchlist
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "52px",
              fontWeight: 900,
              color: c.textPrimary,
              letterSpacing: "-0.03em",
              lineHeight: 0.9,
            }}
          >
            Your Watchlist
          </h1>
          {watchlist.length > 0 && (
            <div
              style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: "italic",
                fontSize: "18px",
                color: c.textSecondary,
              }}
            >
              {watchlist.length} {watchlist.length === 1 ? "stock" : "stocks"}{" "}
              tracked
            </div>
          )}
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 40px",
            border: `1px solid ${c.borderSubtle}`,
          }}
        >
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: "italic",
              fontSize: "24px",
              color: c.textMuted,
              marginBottom: "16px",
            }}
          >
            Your watchlist is empty
          </div>
          <p
            style={{
              fontFamily: '"Georgia", serif',
              fontSize: "15px",
              color: c.textSecondary,
              marginBottom: "24px",
            }}
          >
            Add stocks from the recommendations feed by clicking the bookmark icon.
          </p>
          <Link
            href="/editorial/recommendations"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: '"Georgia", serif',
              fontSize: "13px",
              color: c.accentBear,
              textDecoration: "none",
              borderBottom: `1px solid ${c.accentGold}`,
              paddingBottom: "2px",
            }}
          >
            Browse signals <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <>
          {/* Horizon selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontFamily: '"Georgia", serif',
                fontSize: "12px",
                color: c.textMuted,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Signals for horizon:
            </span>
            {[1, 3, 5, 7, 10].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "13px",
                  fontWeight: horizon === h ? 700 : 400,
                  padding: "4px 10px",
                  background: horizon === h ? c.accentBear : "transparent",
                  border: `1px solid ${horizon === h ? c.accentBear : c.borderSecondary}`,
                  color: horizon === h ? "#fff" : c.textSecondary,
                  cursor: "pointer",
                }}
              >
                {h}D
              </button>
            ))}
          </div>

          {/* Watchlist cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {watchlistData.map(({ ticker, card }) => {
              const isBull = card?.direction === "long";
              const accentColor = isBull
                ? c.accentBull
                : card?.direction === "short"
                  ? c.accentBear
                  : c.accentNeutral;

              return (
                <article
                  key={ticker}
                  style={{
                    borderTop: `3px solid ${card ? accentColor : c.accentGold}`,
                    paddingTop: "16px",
                    position: "relative",
                  }}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => remove(ticker)}
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: 0,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                    title="Remove from watchlist"
                  >
                    <BookmarkX size={14} color={c.textMuted} />
                  </button>

                  <Link
                    href={`/editorial/stocks/${ticker}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "22px",
                        fontWeight: 900,
                        color: accentColor,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatTicker(ticker)}
                    </div>
                    <div
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "12px",
                        color: c.textMuted,
                        marginTop: "2px",
                      }}
                    >
                      {COMPANY_NAMES[ticker] ?? ticker}
                    </div>
                  </Link>

                  {SECTOR_MAP[ticker] && (
                    <div
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "9px",
                        color: c.textMuted,
                        border: `1px solid ${c.borderSecondary}`,
                        padding: "2px 6px",
                        display: "inline-block",
                        marginTop: "6px",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {SECTOR_MAP[ticker]}
                    </div>
                  )}

                  {loading ? (
                    <div
                      style={{
                        marginTop: "12px",
                        height: "60px",
                        background: `linear-gradient(90deg, ${c.shimmerStart} 0%, ${c.shimmerMid} 50%, ${c.shimmerStart} 100%)`,
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite",
                      }}
                    />
                  ) : card ? (
                    <>
                      <div
                        style={{
                          height: "1px",
                          background: c.accentGold,
                          margin: "12px 0",
                          width: "32px",
                        }}
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "8px",
                        }}
                      >
                        {[
                          {
                            l: "Confidence",
                            v: `${card.confidence_pct.toFixed(1)}%`,
                            col: accentColor,
                          },
                          {
                            l: "Exp. Return",
                            v: formatPct(card.expected_return_pct),
                            col: isBull ? c.accentBull : c.accentBear,
                          },
                          {
                            l: "R/R",
                            v: `${card.risk_reward_ratio?.toFixed(2)}×`,
                            col: c.accentGold,
                          },
                          {
                            l: "Entry",
                            v: `₹${formatPrice(card.entry_price)}`,
                          },
                          {
                            l: "Target",
                            v: `₹${formatPrice(card.target_price)}`,
                            col: c.accentBull,
                          },
                          {
                            l: "Stop",
                            v: `₹${formatPrice(card.stop_loss)}`,
                            col: c.accentBear,
                          },
                        ].map(({ l, v, col }) => (
                          <div key={l}>
                            <div
                              style={{
                                fontFamily: '"Georgia", serif',
                                fontSize: "9px",
                                color: c.textMuted,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                              }}
                            >
                              {l}
                            </div>
                            <div
                              style={{
                                fontFamily: '"Playfair Display", serif',
                                fontSize: "13px",
                                fontWeight: 700,
                                color: col ?? c.textPrimary,
                              }}
                            >
                              {v}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        marginTop: "12px",
                        fontFamily: '"Georgia", serif',
                        fontStyle: "italic",
                        fontSize: "12px",
                        color: c.textMuted,
                      }}
                    >
                      No signal for {horizon}D horizon
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
