import type {
  DashboardResponse,
  RecommendationsByHorizonResponse,
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
const API_TIMEOUT_MS = 15_000;

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    globalThis.setTimeout(() => {
      reject(new Error(`API request timed out after ${API_TIMEOUT_MS}ms`));
    }, API_TIMEOUT_MS);
  });

  const request = fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const res = await Promise.race([request, timeout]);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: (signal?: AbortSignal): Promise<HealthResponse> =>
    fetchJSON(`${API_BASE}/api/health`, { signal }),

  metadata: (signal?: AbortSignal): Promise<MetadataConfigResponse> =>
    fetchJSON(`${API_BASE}/api/metadata/config`, { signal }),

  dashboard: (params?: {
    symbols?: string;
    horizon?: number;
    top_n?: number;
  }, signal?: AbortSignal): Promise<DashboardResponse> => {
    const qs = new URLSearchParams();
    if (params?.symbols) qs.set("symbols", params.symbols);
    if (params?.horizon) qs.set("horizon", String(params.horizon));
    if (params?.top_n) qs.set("top_n", String(params.top_n));
    return fetchJSON(`${API_BASE}/api/dashboard?${qs.toString()}`, { signal });
  },

  recommendations: (params?: {
    symbols?: string;
    horizon?: number;
    top_n?: number;
    side?: "long" | "short" | "both";
  }, signal?: AbortSignal): Promise<RecommendationsResponse> => {
    const qs = new URLSearchParams();
    if (params?.symbols) qs.set("symbols", params.symbols);
    if (params?.horizon) qs.set("horizon", String(params.horizon));
    if (params?.top_n) qs.set("top_n", String(params.top_n));
    if (params?.side) qs.set("side", params.side);
    return fetchJSON(`${API_BASE}/api/recommendations?${qs.toString()}`, { signal });
  },

  recommendationsByHorizon: (params?: {
    symbols?: string;
    top_n?: number;
    side?: "long" | "short" | "both";
  }, signal?: AbortSignal): Promise<RecommendationsByHorizonResponse> => {
    const qs = new URLSearchParams();
    if (params?.symbols) qs.set("symbols", params.symbols);
    if (params?.top_n) qs.set("top_n", String(params.top_n));
    if (params?.side) qs.set("side", params.side);
    return fetchJSON(`${API_BASE}/api/recommendations/horizons?${qs.toString()}`, { signal });
  },

  stockDeepDive: (
    ticker: string,
    lookback = 60,
    signal?: AbortSignal,
  ): Promise<StockDeepDiveResponse> =>
    fetchJSON(`${API_BASE}/api/stocks/${ticker}?lookback=${lookback}`, { signal }),

  stockChart: (ticker: string, lookback = 60, signal?: AbortSignal): Promise<StockChartResponse> =>
    fetchJSON(`${API_BASE}/api/stocks/${ticker}/chart?lookback=${lookback}`, { signal }),
};
