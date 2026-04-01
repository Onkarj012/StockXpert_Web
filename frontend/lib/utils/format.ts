// Format INR currency
export function formatINR(value: number | undefined | null): string {
  if (value == null) return "—";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format price
export function formatPrice(value: number | undefined | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format percentage
export function formatPct(
  value: number | undefined | null,
  showSign = true,
): string {
  if (value == null) return "—";
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// Format risk/reward
export function formatRR(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toFixed(2)}x`;
}

// Format datetime for IST
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format short date
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Format ticker to clean symbol
export function formatTicker(ticker: string): string {
  return ticker.replace(".NS", "");
}

// Format volume
export function formatVolume(v: number): string {
  if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
}

// Get confidence color class based on theme
export type ThemeKey = "brutal" | "editorial" | "glass" | "swiss" | "cyber";

export function getConfidenceLabel(pct: number): string {
  if (pct >= 80) return "HIGH";
  if (pct >= 65) return "MED";
  return "LOW";
}

export function getDirectionSymbol(direction: string): string {
  if (direction === "long") return "▲";
  if (direction === "short") return "▼";
  return "◆";
}
