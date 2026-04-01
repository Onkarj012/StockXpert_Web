import type {
  DashboardResponse,
  RecommendationsResponse,
  StockDeepDiveResponse,
  StockChartResponse,
  HealthResponse,
  MetadataConfigResponse,
} from "@/types/api";

// Prefer same-origin `/api/*` calls in production and let Next.js rewrites
// forward those requests to the backend. This avoids browser CORS issues when
// the frontend and backend are hosted on different domains.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: (): Promise<HealthResponse> => fetchJSON(`${API_BASE}/api/health`),

  metadata: (): Promise<MetadataConfigResponse> =>
    fetchJSON(`${API_BASE}/api/metadata/config`),

  dashboard: (params?: {
    symbols?: string;
    horizon?: number;
    top_n?: number;
  }): Promise<DashboardResponse> => {
    const qs = new URLSearchParams();
    if (params?.symbols) qs.set("symbols", params.symbols);
    if (params?.horizon) qs.set("horizon", String(params.horizon));
    if (params?.top_n) qs.set("top_n", String(params.top_n));
    return fetchJSON(`${API_BASE}/api/dashboard?${qs.toString()}`);
  },

  recommendations: (params?: {
    symbols?: string;
    horizon?: number;
    top_n?: number;
    side?: "long" | "short" | "both";
  }): Promise<RecommendationsResponse> => {
    const qs = new URLSearchParams();
    if (params?.symbols) qs.set("symbols", params.symbols);
    if (params?.horizon) qs.set("horizon", String(params.horizon));
    if (params?.top_n) qs.set("top_n", String(params.top_n));
    if (params?.side) qs.set("side", params.side);
    return fetchJSON(`${API_BASE}/api/recommendations?${qs.toString()}`);
  },

  stockDeepDive: (
    ticker: string,
    lookback = 60,
  ): Promise<StockDeepDiveResponse> =>
    fetchJSON(`${API_BASE}/api/stocks/${ticker}?lookback=${lookback}`),

  stockChart: (ticker: string, lookback = 60): Promise<StockChartResponse> =>
    fetchJSON(`${API_BASE}/api/stocks/${ticker}/chart?lookback=${lookback}`),
};
