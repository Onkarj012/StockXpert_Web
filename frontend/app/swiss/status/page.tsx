"use client";

import { useHealth, useMetadata } from "@/lib/api/hooks";
import { formatDateTime } from "@/lib/utils/format";
import { useSwissTheme } from "@/lib/utils/ThemeContext";
import { CheckCircle, AlertCircle } from "lucide-react";

const HV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function SwissStatus() {
  const { data: health, loading: hLoading } = useHealth();
  const { data: meta, loading: mLoading } = useMetadata();
  const c = useSwissTheme();

  const isOk = health?.status === "ok";

  return (
    <div className="py-12">
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: c.textSecondary, marginBottom: "8px" }}>
          System
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
          <h1 style={{ fontFamily: HV, fontSize: "52px", fontWeight: 900, color: c.textPrimary, letterSpacing: "-0.04em", lineHeight: 0.9 }}>
            Status
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            {isOk ? <CheckCircle size={16} color={c.accentCyan} /> : <AlertCircle size={16} color={c.accentRed} />}
            <span style={{ fontFamily: HV, fontSize: "13px", fontWeight: 700, color: isOk ? c.accentCyan : c.accentRed, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {isOk ? "Operational" : "Issue"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ height: "2px", background: c.textPrimary, marginBottom: "32px" }} />

      {hLoading || mLoading ? (
        <div style={{ fontFamily: HV, fontSize: "13px", color: c.textMuted }}>Loading status…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
          {/* Health */}
          <div>
            <div style={{ fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, marginBottom: "8px", borderBottom: `2px solid ${c.textPrimary}`, paddingBottom: "6px" }}>
              Service Health
            </div>

            {[
              { l: "Status", v: health?.status?.toUpperCase(), col: isOk ? c.accentCyan : c.accentRed },
              { l: "Generated", v: health?.generated_at ? formatDateTime(health.generated_at) : "—" },
              { l: "Supported Symbols", v: `${health?.supported_symbols ?? 86}` },
              { l: "Model Version", v: health?.model_version?.split(":")[0] },
            ].map(({ l, v, col }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                <div style={{ fontSize: "12px", color: c.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: col ?? c.textPrimary }}>{v ?? "—"}</div>
              </div>
            ))}

            <div style={{ marginTop: "24px", fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, marginBottom: "8px", borderBottom: `1px solid ${c.textPrimary}`, paddingBottom: "4px" }}>
              Cache Stats
            </div>
            {Object.entries(health?.cache ?? {}).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                <div style={{ fontSize: "11px", color: c.textSecondary, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: c.textPrimary, fontVariantNumeric: "tabular-nums" }}>{String(v)}</div>
              </div>
            ))}

            {health?.last_runs && Object.keys(health.last_runs).length > 0 && (
              <>
                <div style={{ marginTop: "24px", fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, marginBottom: "8px", borderBottom: `1px solid ${c.textPrimary}`, paddingBottom: "4px" }}>
                  Last Operations
                </div>
                {Object.entries(health.last_runs).map(([op, t]) => (
                  <div key={op} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                    <div style={{ fontSize: "11px", color: c.textSecondary, textTransform: "capitalize" }}>{op.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: "11px", color: c.textPrimary, fontVariantNumeric: "tabular-nums" }}>{formatDateTime(t)}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Model Config */}
          <div>
            <div style={{ fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, marginBottom: "8px", borderBottom: `2px solid ${c.accentRed}`, paddingBottom: "6px" }}>
              Model Configuration
            </div>

            {meta?.artifact_contract && [
              { l: "Symbols Count", v: `${meta.artifact_contract.symbols_count}` },
              { l: "Horizons", v: meta.artifact_contract.horizons?.join(", ") + " days" },
              { l: "Ready", v: meta.artifact_contract.ready ? "YES" : "LOADING", col: meta.artifact_contract.ready ? c.accentCyan : c.accentRed },
              { l: "Checkpoint", v: meta.artifact_contract.checkpoint?.split("/").pop() },
              { l: "Scalers", v: meta.artifact_contract.scalers?.split("/").pop() },
            ].map(({ l, v, col }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                <div style={{ fontSize: "12px", color: c.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: col ?? c.textPrimary, wordBreak: "break-all", textAlign: "right", maxWidth: "200px" }}>{v ?? "—"}</div>
              </div>
            ))}

            {meta?.artifact_contract?.windows && (
              <>
                <div style={{ marginTop: "24px", fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, marginBottom: "12px", borderBottom: `1px solid ${c.textPrimary}`, paddingBottom: "4px" }}>
                  Lookback Windows
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  {Object.entries(meta.artifact_contract.windows).map(([type, days]) => (
                    <div key={type} style={{ borderTop: `2px solid ${c.textPrimary}`, paddingTop: "8px" }}>
                      <div style={{ fontFamily: HV, fontSize: "9px", color: c.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>{type}</div>
                      <div style={{ fontFamily: HV, fontSize: "24px", fontWeight: 900, color: c.textPrimary, letterSpacing: "-0.03em" }}>{days}</div>
                      <div style={{ fontFamily: HV, fontSize: "9px", color: c.textMuted }}>sessions</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {meta?.artifact_contract?.feature_counts && (
              <>
                <div style={{ marginTop: "24px", fontFamily: HV, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textPrimary, marginBottom: "8px", borderBottom: `1px solid ${c.textPrimary}`, paddingBottom: "4px" }}>
                  Feature Groups
                </div>
                {Object.entries(meta.artifact_contract.feature_counts).map(([g, n]) => (
                  <div key={g} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${c.borderSubtle}`, fontFamily: HV }}>
                    <div style={{ fontSize: "11px", color: c.textSecondary, textTransform: "capitalize" }}>{g} features</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: c.textPrimary, fontVariantNumeric: "tabular-nums" }}>{n}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
