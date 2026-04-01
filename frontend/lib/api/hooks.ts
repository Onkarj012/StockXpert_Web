"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "./client";
import type {
  DashboardResponse,
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

// Use mock data only when explicitly enabled.
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

function useFetch<T>(
  fetchFn: () => Promise<T>,
  mockData: T,
  deps: unknown[] = [],
): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      console.warn("API unavailable, using mock data:", (e as Error).message);
      // Fall back to mock data during development
      if (USE_MOCK) {
        setData(mockData);
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
    return () => abortRef.current?.abort();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Dashboard hook
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

  return useFetch(() => api.dashboard(params), mockData, [
    params?.horizon,
    params?.top_n,
    params?.symbols,
  ]);
}

export function useRecommendations(params?: {
  horizon?: number;
  top_n?: number;
  side?: "long" | "short" | "both";
  symbols?: string;
}) {
  return useFetch(() => api.recommendations(params), MOCK_RECOMMENDATIONS, [
    params?.horizon,
    params?.top_n,
    params?.symbols,
  ]);
}

// Stock deep dive hook
export function useStockDeepDive(ticker: string, lookback = 60) {
  const mockData = { ...MOCK_DEEP_DIVE, ticker };

  return useFetch(() => api.stockDeepDive(ticker, lookback), mockData, [
    ticker,
    lookback,
  ]);
}

// Stock chart hook
export function useStockChart(ticker: string, lookback = 60) {
  const mockData = { ...MOCK_RELIANCE_CHART, ticker };

  return useFetch(() => api.stockChart(ticker, lookback), mockData, [
    ticker,
    lookback,
  ]);
}

// Health hook
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
    cache: { size: 12, hits: 847, misses: 23 },
    supported_symbols: 86,
    last_runs: {
      recommendations: new Date(Date.now() - 180000).toISOString(),
      dashboard: new Date(Date.now() - 60000).toISOString(),
    },
  };

  return useFetch(() => api.health(), mockData, []);
}

// Metadata hook
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

  return useFetch(() => api.metadata(), mockData, []);
}

// Helper: compute next trading day (IST)
export function getNextTradingDay(from?: Date): Date {
  const d = from ? new Date(from) : new Date();
  const dow = d.getDay(); // 0=Sun, 6=Sat
  // Add 1 day, skip weekends
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Saturday → Monday
  if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sunday → Monday
  return d;
}

// Helper: format date as YYYY-MM-DD for display
export function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

// Helper: get horizon label
export function horizonToLabel(h: number): string {
  return h === 1 ? "Next Day" : `${h} Days`;
}

// Helper: get all 5 horizons data from recommendations API calls
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
  const h1 = useRecommendations({ horizon: 1, side, top_n, symbols });
  const h3 = useRecommendations({ horizon: 3, side, top_n, symbols });
  const h5 = useRecommendations({ horizon: 5, side, top_n, symbols });
  const h7 = useRecommendations({ horizon: 7, side, top_n, symbols });
  const h10 = useRecommendations({ horizon: 10, side, top_n, symbols });

  return [
    { horizon: 1, label: "Next Day", data: h1.data, loading: h1.loading },
    { horizon: 3, label: "3 Days", data: h3.data, loading: h3.loading },
    { horizon: 5, label: "5 Days", data: h5.data, loading: h5.loading },
    { horizon: 7, label: "7 Days", data: h7.data, loading: h7.loading },
    { horizon: 10, label: "10 Days", data: h10.data, loading: h10.loading },
  ];
}
