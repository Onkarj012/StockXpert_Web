import type {
  DashboardResponse,
  RecommendationsResponse,
  StockDeepDiveResponse,
  StockChartResponse,
  RecommendationCard,
  ChartPoint,
} from "@/types/api";

export const MOCK_CARDS: RecommendationCard[] = [
  {
    ticker: "RELIANCE.NS",
    company_name: "Reliance Industries Ltd",
    source: "ml_model",
    direction: "long",
    confidence_pct: 87.5,
    certainty_pct: 82.3,
    current_price: 2456.8,
    entry_price: 2445.0,
    target_price: 2620.0,
    stop_loss: 2380.0,
    expected_return_pct: 7.15,
    risk_reward_ratio: 2.69,
    horizon: "5d",
    support: 2380.0,
    resistance: 2650.0,
    sector: "Energy",
  },
  {
    ticker: "HDFCBANK.NS",
    company_name: "HDFC Bank Ltd",
    source: "ml_model",
    direction: "long",
    confidence_pct: 81.2,
    certainty_pct: 75.8,
    current_price: 1892.45,
    entry_price: 1885.0,
    target_price: 2050.0,
    stop_loss: 1820.0,
    expected_return_pct: 8.76,
    risk_reward_ratio: 2.53,
    horizon: "7d",
    support: 1820.0,
    resistance: 2080.0,
    sector: "Financial Services",
  },
  {
    ticker: "TCS.NS",
    company_name: "Tata Consultancy Services",
    source: "ml_model",
    direction: "short",
    confidence_pct: 76.4,
    certainty_pct: 70.1,
    current_price: 3842.1,
    entry_price: 3850.0,
    target_price: 3620.0,
    stop_loss: 3940.0,
    expected_return_pct: -5.98,
    risk_reward_ratio: 2.56,
    horizon: "5d",
    support: 3600.0,
    resistance: 3950.0,
    sector: "IT",
  },
  {
    ticker: "INFY.NS",
    company_name: "Infosys Ltd",
    source: "ml_model",
    direction: "short",
    confidence_pct: 72.8,
    certainty_pct: 68.5,
    current_price: 1756.3,
    entry_price: 1762.0,
    target_price: 1640.0,
    stop_loss: 1820.0,
    expected_return_pct: -6.92,
    risk_reward_ratio: 2.07,
    horizon: "3d",
    support: 1620.0,
    resistance: 1840.0,
    sector: "IT",
  },
  {
    ticker: "ICICIBANK.NS",
    company_name: "ICICI Bank Ltd",
    source: "ml_model",
    direction: "long",
    confidence_pct: 79.6,
    certainty_pct: 74.2,
    current_price: 1245.6,
    entry_price: 1238.0,
    target_price: 1360.0,
    stop_loss: 1190.0,
    expected_return_pct: 9.86,
    risk_reward_ratio: 2.54,
    horizon: "10d",
    support: 1185.0,
    resistance: 1380.0,
    sector: "Financial Services",
  },
  {
    ticker: "BHARTIARTL.NS",
    company_name: "Bharti Airtel Ltd",
    source: "ml_model",
    direction: "long",
    confidence_pct: 83.1,
    certainty_pct: 78.4,
    current_price: 1687.2,
    entry_price: 1680.0,
    target_price: 1820.0,
    stop_loss: 1620.0,
    expected_return_pct: 8.33,
    risk_reward_ratio: 2.33,
    horizon: "7d",
    support: 1615.0,
    resistance: 1850.0,
    sector: "Telecommunication",
  },
  {
    ticker: "SUNPHARMA.NS",
    company_name: "Sun Pharmaceutical Industries",
    source: "ml_model",
    direction: "long",
    confidence_pct: 68.9,
    certainty_pct: 63.7,
    current_price: 1923.5,
    entry_price: 1918.0,
    target_price: 2080.0,
    stop_loss: 1860.0,
    expected_return_pct: 8.44,
    risk_reward_ratio: 2.72,
    horizon: "10d",
    support: 1840.0,
    resistance: 2100.0,
    sector: "Healthcare",
  },
  {
    ticker: "MARUTI.NS",
    company_name: "Maruti Suzuki India Ltd",
    source: "ml_model",
    direction: "short",
    confidence_pct: 69.3,
    certainty_pct: 64.8,
    current_price: 12456.8,
    entry_price: 12480.0,
    target_price: 11600.0,
    stop_loss: 12900.0,
    expected_return_pct: -7.04,
    risk_reward_ratio: 2.0,
    horizon: "5d",
    support: 11500.0,
    resistance: 12950.0,
    sector: "Automobile",
  },
  {
    ticker: "WIPRO.NS",
    company_name: "Wipro Ltd",
    source: "ml_model",
    direction: "neutral",
    confidence_pct: 52.1,
    certainty_pct: 48.3,
    current_price: 567.4,
    entry_price: 567.0,
    target_price: 590.0,
    stop_loss: 548.0,
    expected_return_pct: 4.06,
    risk_reward_ratio: 1.21,
    horizon: "3d",
    support: 545.0,
    resistance: 598.0,
    sector: "IT",
  },
  {
    ticker: "KOTAKBANK.NS",
    company_name: "Kotak Mahindra Bank",
    source: "ml_model",
    direction: "long",
    confidence_pct: 77.5,
    certainty_pct: 72.3,
    current_price: 2134.7,
    entry_price: 2128.0,
    target_price: 2320.0,
    stop_loss: 2060.0,
    expected_return_pct: 9.02,
    risk_reward_ratio: 2.82,
    horizon: "7d",
    support: 2050.0,
    resistance: 2350.0,
    sector: "Financial Services",
  },
  {
    ticker: "AXISBANK.NS",
    company_name: "Axis Bank Ltd",
    source: "ml_model",
    direction: "long",
    confidence_pct: 74.8,
    certainty_pct: 69.5,
    current_price: 1098.3,
    entry_price: 1092.0,
    target_price: 1210.0,
    stop_loss: 1050.0,
    expected_return_pct: 10.81,
    risk_reward_ratio: 2.76,
    horizon: "10d",
    support: 1040.0,
    resistance: 1240.0,
    sector: "Financial Services",
  },
  {
    ticker: "BAJFINANCE.NS",
    company_name: "Bajaj Finance Ltd",
    source: "ml_model",
    direction: "short",
    confidence_pct: 73.6,
    certainty_pct: 68.1,
    current_price: 7823.5,
    entry_price: 7840.0,
    target_price: 7200.0,
    stop_loss: 8100.0,
    expected_return_pct: -8.16,
    risk_reward_ratio: 2.31,
    horizon: "7d",
    support: 7100.0,
    resistance: 8150.0,
    sector: "Financial Services",
  },
];

export function generateChartData(basePrice: number, days = 60): ChartPoint[] {
  const data: ChartPoint[] = [];
  let price = basePrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (Math.random() - 0.48) * price * 0.025;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low = Math.min(open, close) * (1 - Math.random() * 0.012);
    const volume = Math.floor(Math.random() * 8000000 + 2000000);

    price = close;

    data.push({
      date: date.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      sma_20: parseFloat((price * (0.97 + Math.random() * 0.06)).toFixed(2)),
      sma_50: parseFloat((price * (0.95 + Math.random() * 0.1)).toFixed(2)),
      bb_upper: parseFloat((price * 1.04).toFixed(2)),
      bb_lower: parseFloat((price * 0.96).toFixed(2)),
      vwap_20: parseFloat((price * (0.99 + Math.random() * 0.02)).toFixed(2)),
    });
  }

  return data;
}

export const MOCK_DASHBOARD: DashboardResponse = {
  generated_at: new Date().toISOString(),
  model_version: "20260302_182033_nifty100_improved_v2:model_final.pt",
  market_regime: {
    label: "BULLISH",
    confidence: 73.4,
    description:
      "Trending upward with moderate conviction. Broad market participation improving.",
    regime: "bullish",
  },
  aggregate_sentiment: {
    score: 0.42,
    label: "Positive",
  },
  signal_counts: {
    long: 48,
    short: 23,
    neutral: 15,
  },
  data_freshness: {
    last_price_date: "2026-03-25",
    last_sentiment_date: "2026-03-25",
  },
  sector_summary: {
    "Financial Services": { long: 12, short: 4, neutral: 2 },
    IT: { long: 5, short: 8, neutral: 3 },
    Energy: { long: 6, short: 2, neutral: 1 },
    Healthcare: { long: 7, short: 3, neutral: 2 },
    Automobile: { long: 4, short: 3, neutral: 2 },
    Telecommunication: { long: 4, short: 1, neutral: 1 },
    FMCG: { long: 5, short: 1, neutral: 2 },
    Metals: { long: 3, short: 1, neutral: 2 },
    Cement: { long: 2, short: 0, neutral: 0 },
  },
  top_cards: MOCK_CARDS.slice(0, 8),
};

export const MOCK_RECOMMENDATIONS: RecommendationsResponse = {
  generated_at: new Date().toISOString(),
  model_version: "20260302_182033_nifty100_improved_v2:model_final.pt",
  config_used: "default_bundle",
  sources: ["ml_model"],
  stocks_scanned: { ml_model: 86 },
  count: MOCK_CARDS.length,
  cards: MOCK_CARDS,
};

export const MOCK_RELIANCE_CHART: StockChartResponse = {
  generated_at: new Date().toISOString(),
  ticker: "RELIANCE.NS",
  company_name: "Reliance Industries Ltd",
  points: generateChartData(2456.8),
};

export const MOCK_DEEP_DIVE: StockDeepDiveResponse = {
  generated_at: new Date().toISOString(),
  ticker: "RELIANCE.NS",
  company_name: "Reliance Industries Ltd",
  model_version: "20260302_182033_nifty100_improved_v2:model_final.pt",
  current_price: 2456.8,
  predictions: {
    "1d": {
      direction: "long",
      confidence_pct: 72.1,
      expected_return_pct: 1.2,
      entry_price: 2445.0,
      target_price: 2475.0,
      stop_loss: 2420.0,
    },
    "3d": {
      direction: "long",
      confidence_pct: 78.4,
      expected_return_pct: 3.5,
      entry_price: 2445.0,
      target_price: 2530.0,
      stop_loss: 2400.0,
    },
    "5d": {
      direction: "long",
      confidence_pct: 87.5,
      expected_return_pct: 7.15,
      entry_price: 2445.0,
      target_price: 2620.0,
      stop_loss: 2380.0,
    },
    "7d": {
      direction: "long",
      confidence_pct: 82.3,
      expected_return_pct: 8.9,
      entry_price: 2445.0,
      target_price: 2665.0,
      stop_loss: 2370.0,
    },
    "10d": {
      direction: "long",
      confidence_pct: 74.6,
      expected_return_pct: 11.2,
      entry_price: 2445.0,
      target_price: 2720.0,
      stop_loss: 2340.0,
    },
  },
  gap_prediction: null,
  news_catalysts: [
    {
      date: "2026-03-24",
      headline:
        "Reliance expands green energy portfolio with 10GW solar acquisition",
      sentiment: 0.78,
    },
    {
      date: "2026-03-22",
      headline:
        "JioMart Q4 revenue grows 34% YoY, Jio 5G coverage reaches 80% urban areas",
      sentiment: 0.65,
    },
    {
      date: "2026-03-20",
      headline: "Reliance Industries announces ₹75,000 Cr capex plan for FY27",
      sentiment: 0.55,
    },
    {
      date: "2026-03-18",
      headline: "SEBI scrutiny on RIL stake disclosures; management clarifies",
      sentiment: -0.22,
    },
  ],
  support_resistance: {
    support: [2380.0, 2320.0, 2240.0],
    resistance: [2520.0, 2650.0, 2780.0],
  },
  key_indicators: {
    rsi_14: 62.4,
    macd: 18.6,
    macd_signal: 12.3,
    adx: 31.2,
    mfi_14: 58.7,
    bb_zscore: 0.82,
    volatility_21: 0.0234,
    stoch_k: 71.4,
    trend_strength: 0.68,
    williams_r: -28.5,
  },
  peer_comparison: {
    "ONGC.NS": {
      price: 267.8,
      return_1m: -2.3,
      direction: "neutral",
      confidence: 51.2,
    },
    "COALINDIA.NS": {
      price: 412.5,
      return_1m: 5.6,
      direction: "long",
      confidence: 64.8,
    },
    "IOC.NS": {
      price: 178.2,
      return_1m: 1.2,
      direction: "long",
      confidence: 58.3,
    },
  },
  features_snapshot: {
    bb_zscore: 0.82,
    rsi_14: 62.4,
    trend_strength: 0.68,
  },
  chart: generateChartData(2456.8),
};

export function getMockChartForTicker(
  ticker: string,
  price: number,
): StockChartResponse {
  const card = MOCK_CARDS.find((c) => c.ticker === ticker);
  return {
    generated_at: new Date().toISOString(),
    ticker,
    company_name: card?.company_name ?? ticker,
    points: generateChartData(price),
  };
}
