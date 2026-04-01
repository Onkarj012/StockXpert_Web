import type { ChartPoint, IndicatorConfig, IndicatorResult } from "@/types/terminal";

export function calculateSMA(data: ChartPoint[], period: number): IndicatorResult {
  const values: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      values.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].close;
      }
      values.push(parseFloat((sum / period).toFixed(2)));
    }
  }
  return { values, params: { period } };
}

export function calculateEMA(data: ChartPoint[], period: number): IndicatorResult {
  const values: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  
  let sma = 0;
  for (let i = 0; i < period; i++) {
    sma += data[i].close;
  }
  sma /= period;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      values.push(null);
    } else if (i === period - 1) {
      values.push(parseFloat(sma.toFixed(2)));
    } else {
      const ema = (data[i].close - values[i - 1]!) * multiplier + values[i - 1]!;
      values.push(parseFloat(ema.toFixed(2)));
    }
  }
  return { values, params: { period } };
}

export function calculateBollingerBands(
  data: ChartPoint[],
  period: number = 20,
  stdDev: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSq = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = data[j].close - middle.values[i]!;
        sumSq += diff * diff;
      }
      const std = Math.sqrt(sumSq / period);
      upper.push(parseFloat((middle.values[i]! + stdDev * std).toFixed(2)));
      lower.push(parseFloat((middle.values[i]! - stdDev * std).toFixed(2)));
    }
  }

  return { upper, middle: middle.values, lower };
}

export function calculateVWAP(data: ChartPoint[]): IndicatorResult {
  const values: (number | null)[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < data.length; i++) {
    const tp = (data[i].high + data[i].low + data[i].close) / 3;
    cumulativeTPV += tp * data[i].volume;
    cumulativeVolume += data[i].volume;
    values.push(cumulativeVolume > 0 
      ? parseFloat((cumulativeTPV / cumulativeVolume).toFixed(2)) 
      : null);
  }

  return { values, params: {} };
}

export function calculateRSI(data: ChartPoint[], period: number = 14): IndicatorResult {
  const values: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      values.push(null);
      continue;
    }
    
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);

    if (i < period) {
      values.push(null);
    } else {
      const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        values.push(100);
      } else {
        const rs = avgGain / avgLoss;
        values.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)));
      }
    }
  }

  return { values, params: { period } };
}

export function calculateMACD(
  data: ChartPoint[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (fastEMA.values[i] === null || slowEMA.values[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(parseFloat((fastEMA.values[i]! - slowEMA.values[i]!).toFixed(4)));
    }
  }

  const signalLine: (number | null)[] = [];
  const multiplier = 2 / (signalPeriod + 1);
  
  let signalEMA = 0;
  let count = 0;
  for (let i = slowPeriod - 1; i < data.length; i++) {
    if (macdLine[i] !== null) {
      if (count < signalPeriod - 1) {
        signalEMA += macdLine[i]!;
        count++;
        signalLine.push(null);
      } else if (count === signalPeriod - 1) {
        signalEMA = (signalEMA + macdLine[i]!) / signalPeriod;
        signalLine.push(parseFloat(signalEMA.toFixed(4)));
        count++;
      } else {
        signalEMA = (macdLine[i]! - signalLine[signalLine.length - 1]!) * multiplier + signalLine[signalLine.length - 1]!;
        signalLine.push(parseFloat(signalEMA.toFixed(4)));
      }
    } else {
      signalLine.push(null);
    }
  }

  while (signalLine.length < data.length) {
    signalLine.unshift(null);
  }

  const histogram: (number | null)[] = [];
  const histogramStart = data.length - macdLine.length;
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(parseFloat((macdLine[i]! - signalLine[i]!).toFixed(4)));
    }
  }

  return { 
    macd: macdLine, 
    signal: signalLine, 
    histogram 
  };
}

export function calculateStochastic(
  data: ChartPoint[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: (number | null)[]; d: (number | null)[] } {
  const kValues: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) {
      kValues.push(null);
    } else {
      let lowest = Infinity;
      let highest = -Infinity;
      
      for (let j = i - kPeriod + 1; j <= i; j++) {
        lowest = Math.min(lowest, data[j].low);
        highest = Math.max(highest, data[j].high);
      }
      
      const range = highest - lowest;
      if (range === 0) {
        kValues.push(50);
      } else {
        kValues.push(parseFloat(((data[i].close - lowest) / range * 100).toFixed(2)));
      }
    }
  }

  const dValues: (number | null)[] = [];
  for (let i = 0; i < kValues.length; i++) {
    if (i < dPeriod - 1 || kValues[i] === null) {
      dValues.push(null);
    } else {
      let sum = 0;
      let count = 0;
      for (let j = i - dPeriod + 1; j <= i; j++) {
        if (kValues[j] !== null) {
          sum += kValues[j]!;
          count++;
        }
      }
      dValues.push(count > 0 ? parseFloat((sum / count).toFixed(2)) : null);
    }
  }

  return { k: kValues, d: dValues };
}

export function calculateATR(data: ChartPoint[], period: number = 14): IndicatorResult {
  const values: (number | null)[] = [];
  const trueRanges: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      trueRanges.push(data[i].high - data[i].low);
    } else {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      trueRanges.push(tr);
    }

    if (i < period - 1) {
      values.push(null);
    } else if (i === period - 1) {
      const atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
      values.push(parseFloat(atr.toFixed(4)));
    } else {
      const prevATR = values[i - 1]!;
      const atr = (prevATR * (period - 1) + trueRanges[i]) / period;
      values.push(parseFloat(atr.toFixed(4)));
    }
  }

  return { values, params: { period } };
}

export function calculatePivotPoints(
  data: ChartPoint[],
  type: "traditional" | "fibonacci" | "camarilla" | "woodie" = "traditional"
): {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
} {
  const last = data[data.length - 1];
  const high = last.high;
  const low = last.low;
  const close = last.close;

  let pivot: number, r1: number, r2: number, r3: number;
  let s1: number, s2: number, s3: number;

  switch (type) {
    case "traditional":
      pivot = (high + low + close) / 3;
      r1 = 2 * pivot - low;
      s1 = 2 * pivot - high;
      r2 = pivot + (high - low);
      s2 = pivot - (high - low);
      r3 = high + 2 * (pivot - low);
      s3 = low - 2 * (high - pivot);
      break;
    case "fibonacci":
      pivot = (high + low + close) / 3;
      r1 = pivot + 0.382 * (high - low);
      s1 = pivot - 0.382 * (high - low);
      r2 = pivot + 0.618 * (high - low);
      s2 = pivot - 0.618 * (high - low);
      r3 = pivot + 1 * (high - low);
      s3 = pivot - 1 * (high - low);
      break;
    case "camarilla":
      pivot = close;
      r1 = close + 0.0916 * (high - low);
      s1 = close - 0.0916 * (high - low);
      r2 = close + 0.183 * (high - low);
      s2 = close - 0.183 * (high - low);
      r3 = close + 0.275 * (high - low);
      s3 = close - 0.275 * (high - low);
      break;
    case "woodie":
      pivot = (high + low + 2 * close) / 4;
      r1 = 2 * pivot - low;
      s1 = 2 * pivot - high;
      r2 = pivot + (high - low);
      s2 = pivot - (high - low);
      r3 = high + 2 * (pivot - low);
      s3 = low - 2 * (high - pivot);
      break;
  }

  return {
    pivot: parseFloat(pivot.toFixed(2)),
    r1: parseFloat(r1.toFixed(2)),
    r2: parseFloat(r2.toFixed(2)),
    r3: parseFloat(r3.toFixed(2)),
    s1: parseFloat(s1.toFixed(2)),
    s2: parseFloat(s2.toFixed(2)),
    s3: parseFloat(s3.toFixed(2)),
  };
}

export function calculateIchimoku(
  data: ChartPoint[]
): {
  tenkan: (number | null)[];
  kijun: (number | null)[];
  senkouA: (number | null)[];
  senkouB: (number | null)[];
  chikou: (number | null)[];
} {
  const period9 = 9;
  const period26 = 26;
  const period52 = 52;

  const tenkan: (number | null)[] = [];
  const kijun: (number | null)[] = [];
  const senkouA: (number | null)[] = [];
  const senkouB: (number | null)[] = [];
  const chikou: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    chikou.push(data[i].close);

    if (i < period9 - 1) {
      tenkan.push(null);
    } else {
      let highest = -Infinity;
      let lowest = Infinity;
      for (let j = i - period9 + 1; j <= i; j++) {
        highest = Math.max(highest, data[j].high);
        lowest = Math.min(lowest, data[j].low);
      }
      tenkan.push(parseFloat(((highest + lowest) / 2).toFixed(2)));
    }

    if (i < period26 - 1) {
      kijun.push(null);
      senkouA.push(null);
      senkouB.push(null);
    } else {
      let highest26 = -Infinity;
      let lowest26 = Infinity;
      for (let j = i - period26 + 1; j <= i; j++) {
        highest26 = Math.max(highest26, data[j].high);
        lowest26 = Math.min(lowest26, data[j].low);
      }
      kijun.push(parseFloat(((highest26 + lowest26) / 2).toFixed(2)));

      if (tenkan[i] !== null && kijun[i] !== null) {
        senkouA.push(parseFloat(((tenkan[i]! + kijun[i]!) / 2).toFixed(2)));
      } else {
        senkouA.push(null);
      }

      if (i < period52 - 1) {
        senkouB.push(null);
      } else {
        let highest52 = -Infinity;
        let lowest52 = Infinity;
        for (let j = i - period52 + 1; j <= i; j++) {
          highest52 = Math.max(highest52, data[j].high);
          lowest52 = Math.min(lowest52, data[j].low);
        }
        senkouB.push(parseFloat(((highest52 + lowest52) / 2).toFixed(2)));
      }
    }
  }

  return { tenkan, kijun, senkouA, senkouB, chikou };
}

export function calculateSupertrend(
  data: ChartPoint[],
  period: number = 10,
  multiplier: number = 3
): { values: (number | null)[]; direction: (1 | -1 | null)[] } {
  const atr = calculateATR(data, period);
  const values: (number | null)[] = [];
  const direction: (1 | -1 | null)[] = [];

  let finalUpper = 0;
  let finalLower = 0;
  let supertrend = 0;
  let dir: 1 | -1 = 1;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || atr.values[i] === null) {
      values.push(null);
      direction.push(null);
      continue;
    }

    const hl2 = (data[i].high + data[i].low) / 2;
    const atrVal = atr.values[i]! * multiplier;

    const upper = hl2 + atrVal;
    const lower = hl2 - atrVal;

    finalUpper = i === 0 ? upper : Math.max(finalUpper, upper);
    finalLower = i === 0 ? lower : Math.min(finalLower, lower);

    const prevST = i > 0 ? (values[i - 1] ?? 0) : 0;
    const prevDir = i > 0 ? direction[i - 1] : 1;

    if (prevDir === -1) {
      finalUpper = Math.max(finalUpper, data[i].high);
    } else {
      finalLower = Math.min(finalLower, data[i].low);
    }

    if (prevDir === 1 && data[i].close < finalUpper) {
      dir = -1;
      supertrend = finalUpper;
    } else if (prevDir === -1 && data[i].close > finalLower) {
      dir = 1;
      supertrend = finalLower;
    } else {
      supertrend = dir === 1 ? finalLower : finalUpper;
    }

    values.push(parseFloat(supertrend.toFixed(2)));
    direction.push(dir);
  }

  return { values, direction };
}

export function applyIndicator(
  data: ChartPoint[],
  config: IndicatorConfig
): (number | null)[] | Record<string, (number | null)[]> {
  switch (config.id) {
    case "sma":
      return calculateSMA(data, config.params.period ?? 20).values;
    case "ema":
      return calculateEMA(data, config.params.period ?? 20).values;
    case "bollinger":
      const bb = calculateBollingerBands(data, config.params.period ?? 20, config.params.stdDev ?? 2);
      return { upper: bb.upper, middle: bb.middle, lower: bb.lower };
    case "vwap":
      return calculateVWAP(data).values;
    case "rsi":
      return calculateRSI(data, config.params.period ?? 14).values;
    case "macd":
      const macd = calculateMACD(
        data,
        config.params.fast ?? 12,
        config.params.slow ?? 26,
        config.params.signal ?? 9
      );
      return { macd: macd.macd, signal: macd.signal, histogram: macd.histogram };
    case "stochastic":
      const stoch = calculateStochastic(data, config.params.kPeriod ?? 14, config.params.dPeriod ?? 3);
      return { k: stoch.k, d: stoch.d };
    case "atr":
      return calculateATR(data, config.params.period ?? 14).values;
    case "pivot":
      const pivotType = (config.params.type === 1 ? "traditional" : config.params.type === 2 ? "fibonacci" : config.params.type === 3 ? "camarilla" : config.params.type === 4 ? "woodie" : "traditional") as "traditional" | "fibonacci" | "camarilla" | "woodie";
      const pivot = calculatePivotPoints(data, pivotType);
      return { pivot: [pivot.pivot], r1: [pivot.r1], r2: [pivot.r2], r3: [pivot.r3], s1: [pivot.s1], s2: [pivot.s2], s3: [pivot.s3] };
    case "ichimoku":
      return calculateIchimoku(data);
    case "supertrend":
      return calculateSupertrend(data, config.params.period ?? 10, config.params.multiplier ?? 3).values;
    default:
      return [];
  }
}

export function generateHeikinAshi(data: ChartPoint[]): ChartPoint[] {
  const haData: ChartPoint[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const haClose = (data[i].open + data[i].high + data[i].low + data[i].close) / 4;
    const haOpen = i === 0 
      ? (data[i].open + data[i].close) / 2 
      : (haData[i - 1].open + haData[i - 1].close) / 2;
    const haHigh = Math.max(data[i].high, Math.max(haOpen, haClose));
    const haLow = Math.min(data[i].low, Math.min(haOpen, haClose));

    haData.push({
      date: data[i].date,
      timestamp: data[i].timestamp,
      open: parseFloat(haOpen.toFixed(2)),
      high: parseFloat(haHigh.toFixed(2)),
      low: parseFloat(haLow.toFixed(2)),
      close: parseFloat(haClose.toFixed(2)),
      volume: data[i].volume,
    });
  }

  return haData;
}
