"use client";

import useSWR from "swr";
import type { Key, SWRConfiguration } from "swr";

import { api } from "./client";
import type {
  DashboardResponse,
  RecommendationsByHorizonResponse,
  RecommendationsResponse,
  StockDeepDiveResponse,
  StockChartResponse,
  HealthResponse,
  MetadataConfigResponse,
} from "@/types/api";
import {
  MOCK_DASHBOARD,
  MOCK_RECOMMENDATIONS,
  MOCK_DEEP_DIVE,
  MOCK_RELIANCE_CHART,
} from "@/lib/mock/data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const CANONICAL_STOCK_LOOKBACK = 365;

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

type SWRFetcher<T, K extends Key> = (key: K) => Promise<T>;

function withMockFallback<T, K extends Key>(
  fetcher: SWRFetcher<T, K>,
  mockData: T,
): SWRFetcher<T, K> {
  return async (key: K) => {
    try {
      return await fetcher(key);
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw error;
      }
      console.warn("API unavailable, using mock data:", (error as Error).message);
      if (USE_MOCK) {
        return mockData;
      }
      throw error;
    }
  };
}

function useApiSWR<T, K extends Key>(
  key: K | null,
  fetcher: SWRFetcher<T, K>,
  mockData: T,
  config?: SWRConfiguration<T, Error>,
): FetchState<T> {
  const { data, error, isLoading, mutate } = useSWR<T, Error>(
    key,
    key === null ? null : withMockFallback(fetcher, mockData),
    config,
  );

  return {
    data: data ?? null,
    loading: isLoading,
    error: error && error.name !== "AbortError" ? error.message : null,
    refetch: () => {
      void mutate();
    },
  };
}

function normalizeStockLookback(lookback: number): number {
  return Math.max(60, Math.min(lookback, CANONICAL_STOCK_LOOKBACK));
}

function trimDeepDivePayload(payload: StockDeepDiveResponse, lookback: number): StockDeepDiveResponse {
  return {
    ...payload,
    chart: payload.chart.slice(-normalizeStockLookback(lookback)),
  };
}

function trimChartPayload(payload: StockChartResponse, lookback: number): StockChartResponse {
  const points = payload.points.slice(-normalizeStockLookback(lookback));
  return {
    ...payload,
    points,
  };
}

type DashboardKey = readonly ["dashboard", number | undefined, number | undefined, string | undefined];
type RecommendationsKey = readonly [
  "recommendations",
  number | undefined,
  number | undefined,
  "long" | "short" | "both" | undefined,
  string | undefined,
];
type AllHorizonsKey = readonly [
  "recommendations-horizons",
  number | undefined,
  "long" | "short" | "both" | undefined,
  string | undefined,
];
type StockKey = readonly ["stock-deep-dive", string];
type StockChartKey = readonly ["stock-chart", string];

export function useDashboard(params?: {
  horizon?: number;
  top_n?: number;
  symbols?: string;
}) {
  const mockData = {
    ...MOCK_DASHBOARD,
    top_cards: params?.top_n
      ? MOCK_DASHBOARD.top_cards.slice(0, params.top_n)
      : MOCK_DASHBOARD.top_cards,
  };

  return useApiSWR<DashboardResponse, DashboardKey>(
    ["dashboard", params?.horizon, params?.top_n, params?.symbols],
    ([, horizon, top_n, symbols]) => api.dashboard({ horizon, top_n, symbols }),
    mockData,
  );
}

export function useRecommendations(params?: {
  horizon?: number;
  top_n?: number;
  side?: "long" | "short" | "both";
  symbols?: string;
}) {
  return useApiSWR<RecommendationsResponse, RecommendationsKey>(
    ["recommendations", params?.horizon, params?.top_n, params?.side, params?.symbols],
    ([, horizon, top_n, side, symbols]) =>
      api.recommendations({ horizon, top_n, side, symbols }),
    MOCK_RECOMMENDATIONS,
  );
}

export function useRecommendationsByHorizon(params?: {
  top_n?: number;
  side?: "long" | "short" | "both";
  symbols?: string;
}) {
  const mockData: RecommendationsByHorizonResponse = {
    generated_at: new Date().toISOString(),
    market_date: new Date().toISOString().split("T")[0],
    model_version: "mock:model",
    config_used: "mock-config",
    horizons: [1, 3, 5, 7, 10],
    recommendations_by_horizon: {
      "1": { horizon: 1, ...MOCK_RECOMMENDATIONS },
      "3": { horizon: 3, ...MOCK_RECOMMENDATIONS, cards: MOCK_RECOMMENDATIONS.cards.map((card) => ({ ...card, horizon: "H3" })) },
      "5": { horizon: 5, ...MOCK_RECOMMENDATIONS, cards: MOCK_RECOMMENDATIONS.cards.map((card) => ({ ...card, horizon: "H5" })) },
      "7": { horizon: 7, ...MOCK_RECOMMENDATIONS, cards: MOCK_RECOMMENDATIONS.cards.map((card) => ({ ...card, horizon: "H7" })) },
      "10": { horizon: 10, ...MOCK_RECOMMENDATIONS, cards: MOCK_RECOMMENDATIONS.cards.map((card) => ({ ...card, horizon: "H10" })) },
    },
  };

  return useApiSWR<RecommendationsByHorizonResponse, AllHorizonsKey>(
    ["recommendations-horizons", params?.top_n, params?.side, params?.symbols],
    ([, top_n, side, symbols]) =>
      api.recommendationsByHorizon({ top_n, side, symbols }),
    mockData,
  );
}

export function useStockDeepDive(ticker: string, lookback = 60): FetchState<StockDeepDiveResponse> {
  const mockData = trimDeepDivePayload({ ...MOCK_DEEP_DIVE, ticker }, lookback);
  const state = useApiSWR<StockDeepDiveResponse, StockKey>(
    ["stock-deep-dive", ticker],
    ([, symbol]) => api.stockDeepDive(symbol, CANONICAL_STOCK_LOOKBACK),
    { ...MOCK_DEEP_DIVE, ticker },
  );

  return {
    ...state,
    data: state.data ? trimDeepDivePayload(state.data, lookback) : null,
    error: state.error,
    loading: state.loading,
    refetch: state.refetch,
  };
}

export function useStockChart(ticker: string, lookback = 60): FetchState<StockChartResponse> {
  const mockData = trimChartPayload({ ...MOCK_RELIANCE_CHART, ticker }, lookback);
  const state = useApiSWR<StockChartResponse, StockChartKey>(
    ["stock-chart", ticker],
    ([, symbol]) => api.stockChart(symbol, CANONICAL_STOCK_LOOKBACK),
    { ...MOCK_RELIANCE_CHART, ticker },
  );

  return {
    ...state,
    data: state.data ? trimChartPayload(state.data, lookback) : (USE_MOCK ? mockData : null),
    error: state.error,
    loading: state.loading,
    refetch: state.refetch,
  };
}

export function useHealth() {
  const mockData: HealthResponse = {
    status: "ok",
    generated_at: new Date().toISOString(),
    model_version: "20260302_182033_nifty100_improved_v2:model_final.pt",
    artifacts: {
      ready: true,
      checkpoint: "loaded",
      scalers: "loaded",
      calibrator: "loaded",
    },
    cache: { items: 12, total: 12 },
    supported_symbols: 86,
    last_runs: {
      recommendations_snapshot: new Date(Date.now() - 180000).toISOString(),
      dashboard: new Date(Date.now() - 60000).toISOString(),
    },
    snapshot: {
      status: "current",
      market_date: new Date().toISOString().split("T")[0],
      generated_at: new Date(Date.now() - 180000).toISOString(),
      path: "backend/artifacts/cache/recommendations_today.json",
      is_today: true,
    },
  };

  return useApiSWR<HealthResponse, "health">("health", () => api.health(), mockData);
}

export function useMetadata() {
  const mockData: MetadataConfigResponse = {
    generated_at: new Date().toISOString(),
    artifact_contract: {
      manifest_path: "artifacts/model_manifest.json",
      bundle_dir: "artifacts/default_bundle",
      checkpoint: "checkpoints/model_final.pt",
      scalers: "artifacts/scalers.pkl",
      calibrator: "artifacts/calibrator.pkl",
      symbols_count: 86,
      horizons: [1, 3, 5, 7, 10],
      windows: { short: 7, mid: 21, long: 60 },
      feature_counts: { short: 8, mid: 12, long: 8, context: 18, sentiment: 9 },
      model_version: "20260302_182033_nifty100_improved_v2:model_final.pt",
      ready: true,
    },
  };

  return useApiSWR<MetadataConfigResponse, "metadata">(
    "metadata",
    () => api.metadata(),
    mockData,
  );
}

export function getNextTradingDay(from?: Date): Date {
  const d = from ? new Date(from) : new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

export function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function horizonToLabel(h: number): string {
  return h === 1 ? "Next Day" : `${h} Days`;
}

export type HorizonData = {
  horizon: number;
  label: string;
  data: RecommendationsResponse | null;
  loading: boolean;
};

export function useAllHorizons(
  side: "long" | "short" | "both" = "both",
  top_n = 10,
  symbols?: string,
): HorizonData[] {
  const { data, loading } = useRecommendationsByHorizon({ side, top_n, symbols });

  return [1, 3, 5, 7, 10].map((horizon) => {
    const horizonData = data?.recommendations_by_horizon[String(horizon)] ?? null;
    return {
      horizon,
      label: horizon === 1 ? "Next Day" : `${horizon} Days`,
      data: horizonData,
      loading,
    };
  });
}
