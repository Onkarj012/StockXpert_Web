"use client";

import { useHealth, useMetadata } from "@/lib/api/hooks";
import { formatDateTime } from "@/lib/utils/format";
import { useEditorialTheme } from "@/lib/utils/ThemeContext";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Cpu,
  BarChart2,
} from "lucide-react";

export default function EditorialStatus() {
  const { data: health, loading: hLoading } = useHealth();
  const { data: meta, loading: mLoading } = useMetadata();
  const c = useEditorialTheme();

  const isOk = health?.status === "ok";

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
          System Intelligence
        </div>
        <h1
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "52px",
            fontWeight: 900,
            color: c.textPrimary,
            letterSpacing: "-0.03em",
            lineHeight: 0.9,
            marginBottom: "16px",
          }}
        >
          Model Status
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isOk ? (
            <CheckCircle size={18} color={c.accentBull} />
          ) : (
            <AlertCircle size={18} color={c.accentBear} />
          )}
          <span
            style={{
              fontFamily: '"Georgia", serif',
              fontSize: "16px",
              color: isOk ? c.accentBull : c.accentBear,
              fontWeight: 600,
            }}
          >
            {isOk ? "All systems operational" : "System issue detected"}
          </span>
        </div>
      </div>

      {hLoading || mLoading ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            fontFamily: '"Georgia", serif',
            fontStyle: "italic",
            color: c.textMuted,
          }}
        >
          Loading system status…
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
          }}
        >
          {/* Health Panel */}
          <div>
            <div
              style={{
                borderTop: `3px solid ${c.accentBull}`,
                paddingTop: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Cpu size={16} color={c.accentBull} />
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "22px",
                    fontWeight: 900,
                    color: c.textPrimary,
                  }}
                >
                  System Health
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                {[
                  {
                    label: "API Status",
                    value: health?.status?.toUpperCase() ?? "—",
                    highlight: isOk,
                  },
                  {
                    label: "Symbols",
                    value: `${health?.supported_symbols ?? 86} stocks`,
                    highlight: false,
                  },
                  {
                    label: "Generated",
                    value: health?.generated_at
                      ? formatDateTime(health.generated_at)
                      : "—",
                    highlight: false,
                  },
                  {
                    label: "Model Version",
                    value: health?.model_version?.split(":")[0] ?? "—",
                    highlight: false,
                  },
                ].map(({ label, value, highlight }) => (
                  <div
                    key={label}
                    style={{
                      borderBottom: `1px solid ${c.borderSubtle}`,
                      paddingBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "10px",
                        color: c.textMuted,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "14px",
                        fontWeight: 700,
                        color: highlight ? c.accentBull : c.textPrimary,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cache Stats */}
            <div style={{ borderTop: `2px solid ${c.accentGold}`, paddingTop: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <Database size={14} color={c.accentGold} />
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "18px",
                    fontWeight: 900,
                    color: c.textPrimary,
                  }}
                >
                  Cache Statistics
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                }}
              >
                {Object.entries(health?.cache ?? {})
                  .slice(0, 6)
                  .map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        borderBottom: `1px solid ${c.borderSubtle}`,
                        paddingBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: '"Georgia", serif',
                          fontSize: "9px",
                          color: c.textMuted,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          marginBottom: "3px",
                        }}
                      >
                        {key.replace(/_/g, " ")}
                      </div>
                      <div
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: "16px",
                          fontWeight: 700,
                          color: c.textPrimary,
                        }}
                      >
                        {String(val)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Last Runs */}
            {health?.last_runs && Object.keys(health.last_runs).length > 0 && (
              <div
                style={{
                  marginTop: "24px",
                  borderTop: `2px solid ${c.borderSubtle}`,
                  paddingTop: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <Clock size={14} color={c.textSecondary} />
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: "18px",
                      fontWeight: 900,
                      color: c.textPrimary,
                    }}
                  >
                    Last Operations
                  </div>
                </div>
                {Object.entries(health.last_runs).map(([op, time]) => (
                  <div
                    key={op}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "8px",
                      marginBottom: "8px",
                      borderBottom: `1px solid ${c.borderSubtle}`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"Georgia", serif',
                        fontSize: "13px",
                        color: c.textSecondary,
                        textTransform: "capitalize",
                      }}
                    >
                      {op.replace(/_/g, " ")}
                    </div>
                    <div
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "13px",
                        color: c.textPrimary,
                      }}
                    >
                      {formatDateTime(time)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Configuration */}
          <div>
            <div
              style={{
                borderTop: `3px solid ${c.accentBear}`,
                paddingTop: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <BarChart2 size={16} color={c.accentBear} />
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "22px",
                    fontWeight: 900,
                    color: c.textPrimary,
                  }}
                >
                  Model Configuration
                </div>
              </div>

              {meta?.artifact_contract && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      label: "Model ID",
                      value:
                        meta.artifact_contract.model_version?.split(":")[0],
                    },
                    {
                      label: "Symbols Count",
                      value: `${meta.artifact_contract.symbols_count} stocks`,
                    },
                    {
                      label: "Horizons",
                      value:
                        meta.artifact_contract.horizons?.join(", ") + " days",
                    },
                    {
                      label: "Ready",
                      value: meta.artifact_contract.ready ? "Yes" : "Loading",
                    },
                    {
                      label: "Checkpoint",
                      value: meta.artifact_contract.checkpoint
                        ?.split("/")
                        .pop(),
                    },
                    {
                      label: "Scalers",
                      value: meta.artifact_contract.scalers?.split("/").pop(),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        borderBottom: `1px solid ${c.borderSubtle}`,
                        paddingBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: '"Georgia", serif',
                          fontSize: "10px",
                          color: c.textMuted,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: "13px",
                          fontWeight: 700,
                          color: c.textPrimary,
                          wordBreak: "break-all",
                        }}
                      >
                        {value ?? "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feature Windows */}
            {meta?.artifact_contract?.windows && (
              <div
                style={{
                  borderTop: `2px solid ${c.borderSubtle}`,
                  paddingTop: "16px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "18px",
                    fontWeight: 900,
                    color: c.textPrimary,
                    marginBottom: "12px",
                  }}
                >
                  Lookback Windows
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                  }}
                >
                  {Object.entries(meta.artifact_contract.windows).map(
                    ([type, days]) => (
                      <div
                        key={type}
                        style={{
                          borderTop: `2px solid ${type === "short" ? c.accentBear : type === "mid" ? c.accentGold : c.accentBull}`,
                          paddingTop: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: '"Georgia", serif',
                            fontSize: "9px",
                            color: c.textMuted,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            marginBottom: "4px",
                          }}
                        >
                          {type}
                        </div>
                        <div
                          style={{
                            fontFamily: '"Playfair Display", serif',
                            fontSize: "24px",
                            fontWeight: 900,
                            color: c.textPrimary,
                          }}
                        >
                          {days}
                        </div>
                        <div
                          style={{
                            fontFamily: '"Georgia", serif',
                            fontSize: "10px",
                            color: c.textMuted,
                          }}
                        >
                          trading days
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Feature Counts */}
            {meta?.artifact_contract?.feature_counts && (
              <div
                style={{
                  borderTop: `2px solid ${c.borderSubtle}`,
                  paddingTop: "16px",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "18px",
                    fontWeight: 900,
                    color: c.textPrimary,
                    marginBottom: "12px",
                  }}
                >
                  Feature Groups
                </div>
                {Object.entries(meta.artifact_contract.feature_counts).map(
                  ([group, count]) => (
                    <div
                      key={group}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingBottom: "8px",
                        marginBottom: "8px",
                        borderBottom: `1px solid ${c.borderSubtle}`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: '"Georgia", serif',
                          fontSize: "13px",
                          color: c.textSecondary,
                          textTransform: "capitalize",
                        }}
                      >
                        {group} features
                      </div>
                      <div
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          fontSize: "14px",
                          fontWeight: 700,
                          color: c.textPrimary,
                        }}
                      >
                        {count}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
