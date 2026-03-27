// Types matching backend schemas from backend/app/schemas/api.py

export interface RecommendationCard {
  ticker: string;
  company_name: string;
  source: string;
  direction: "long" | "short" | "neutral";
  confidence_pct: number;
  certainty_pct?: number;
  current_price?: number;
  entry_price?: number;
  target_price?: number;
  stop_loss?: number;
  expected_return_pct?: number;
  risk_reward_ratio?: number;
  horizon: string;
  support?: number;
  resistance?: number;
  sector?: string;
  secondary?: Record<string, unknown>;
}

export interface ChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  overlays?: Record<string, number | null>;
  sma_20?: number;
  sma_50?: number;
  bb_upper?: number;
  bb_lower?: number;
  vwap_20?: number;
}

export interface MarketRegime {
  label: string;
  confidence?: number;
  description?: string;
  regime?: string;
  [key: string]: unknown;
}

export interface AggregateSentiment {
  score?: number;
  label?: string;
  [key: string]: unknown;
}

export interface SignalCounts {
  long: number;
  short: number;
  neutral: number;
}

export interface SectorSummary {
  [sector: string]: { long: number; short: number; neutral: number };
}

export interface DataFreshness {
  last_price_date?: string;
  last_sentiment_date?: string;
  [key: string]: unknown;
}

export interface DashboardResponse {
  generated_at: string;
  model_version: string;
  market_regime: MarketRegime;
  aggregate_sentiment: AggregateSentiment;
  signal_counts: SignalCounts;
  data_freshness: DataFreshness;
  sector_summary: SectorSummary;
  top_cards: RecommendationCard[];
}

export interface RecommendationsResponse {
  generated_at: string;
  model_version: string;
  config_used: string;
  sources: string[];
  stocks_scanned: Record<string, number>;
  count: number;
  cards: RecommendationCard[];
}

export interface PredictionEntry {
  direction: string;
  confidence_pct: number;
  expected_return_pct: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  [key: string]: unknown;
}

export interface StockDeepDiveResponse {
  generated_at: string;
  ticker: string;
  company_name: string;
  model_version: string;
  current_price: number;
  predictions: Record<string, PredictionEntry>;
  gap_prediction: unknown;
  news_catalysts: Array<{
    date: string;
    headline: string;
    sentiment: number;
    [key: string]: unknown;
  }>;
  support_resistance: {
    support?: number[];
    resistance?: number[];
    [key: string]: unknown;
  };
  key_indicators: Record<string, number | null>;
  peer_comparison: Record<string, unknown>;
  features_snapshot: Record<string, unknown>;
  chart: ChartPoint[];
}

export interface StockChartResponse {
  generated_at: string;
  ticker: string;
  company_name: string;
  points: ChartPoint[];
}

export interface HealthResponse {
  status: string;
  generated_at: string;
  model_version?: string;
  artifacts: Record<string, unknown>;
  cache: Record<string, unknown>;
  supported_symbols?: number;
  last_runs: Record<string, string>;
}

export interface ArtifactContract {
  manifest_path: string;
  bundle_dir: string;
  checkpoint: string;
  scalers: string;
  calibrator?: string;
  run_config?: string;
  symbols_count: number;
  horizons: number[];
  windows: Record<string, number>;
  feature_counts: Record<string, number>;
  model_version: string;
  supported_symbols?: string[];
  ready?: boolean;
}

export interface MetadataConfigResponse {
  generated_at: string;
  artifact_contract: ArtifactContract;
}
